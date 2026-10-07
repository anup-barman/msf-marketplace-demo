import { prisma, generateListingsForWebsite, WEBSITE_CONFIG, getGeneratorSettings, logGeneration } from "@upay/shared";

interface GeneratorState {
  intervalId: NodeJS.Timeout | null;
  isRunning: boolean;
}

const generators = new Map<string, GeneratorState>();

async function runGenerationCycle(websiteId: string, productCategories: string[]) {
  const settings = await getGeneratorSettings(prisma, websiteId);
  if (!settings || !settings.isEnabled) return;

  try {
    const count = await generateListingsForWebsite(
      prisma,
      websiteId,
      productCategories as any,
      settings.rowsPerTick,
      Date.now()
    );
    await logGeneration(prisma, websiteId, count, true);
    console.log(`[${new Date().toISOString()}] ✅ Website ${websiteId}: Generated ${count} listings`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logGeneration(prisma, websiteId, 0, false, message);
    console.error(`[${new Date().toISOString()}] ❌ Website ${websiteId}: Generation failed - ${message}`);
  }
}

function startGenerator(websiteId: string, productCategories: string[], intervalMs: number) {
  const state = generators.get(websiteId);
  if (state?.isRunning) {
    console.log(`⚠️ Generator for ${websiteId} already running`);
    return;
  }

  const intervalId = setInterval(() => {
    runGenerationCycle(websiteId, productCategories);
  }, intervalMs);

  generators.set(websiteId, { intervalId, isRunning: true });
  console.log(`🚀 Started generator for ${websiteId} (interval: ${intervalMs}ms)`);
}

function stopGenerator(websiteId: string) {
  const state = generators.get(websiteId);
  if (state?.intervalId) {
    clearInterval(state.intervalId);
    generators.set(websiteId, { ...state, intervalId: null, isRunning: false });
    console.log(`🛑 Stopped generator for ${websiteId}`);
  }
}

async function initializeGenerators() {
  console.log("🔄 Initializing generators...");
  
  for (const [key, config] of Object.entries(WEBSITE_CONFIG)) {
    const website = await prisma.website.findUnique({ where: { slug: config.slug } });
    if (!website) {
      console.log(`⚠️ Website ${config.slug} not found, skipping`);
      continue;
    }

    const settings = await getGeneratorSettings(prisma, website.id);
    if (settings?.isEnabled) {
      startGenerator(website.id, config.productCategories, settings.intervalMs);
    } else {
      console.log(`⏸️ Generator for ${config.name} is disabled`);
    }
  }
}

async function main() {
  console.log("🤖 Starting background data generation worker...");
  
  await initializeGenerators();

  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down worker...");
    for (const [websiteId] of generators) {
      stopGenerator(websiteId);
    }
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down worker...");
    for (const [websiteId] of generators) {
      stopGenerator(websiteId);
    }
    await prisma.$disconnect();
    process.exit(0);
  });

  console.log("✅ Worker running. Press Ctrl+C to stop.");
}

main().catch((e) => {
  console.error("❌ Worker failed:", e);
  process.exit(1);
});