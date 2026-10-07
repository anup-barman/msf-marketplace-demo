import { prisma, generateListingsForWebsite, WEBSITE_CONFIG } from "../src";

async function main() {
  console.log("🌱 Seeding database...");

  for (const [key, config] of Object.entries(WEBSITE_CONFIG)) {
    console.log(`\n📦 Setting up website: ${config.name} (${config.slug})`);

    const website = await prisma.website.upsert({
      where: { slug: config.slug },
      update: { name: config.name, description: config.description, isActive: true },
      create: { name: config.name, slug: config.slug, description: config.description, isActive: true },
    });

    console.log(`   Website ID: ${website.id}`);

    const existingCount = await prisma.listing.count({ where: { websiteId: website.id } });
    console.log(`   Existing listings: ${existingCount}`);

    if (existingCount === 0) {
      const initialCount = Math.floor(Math.random() * 21) + 30;
      console.log(`   Generating ${initialCount} initial listings...`);
      
      const generated = await generateListingsForWebsite(
        prisma,
        website.id,
        config.productCategories,
        initialCount,
        Date.now() + key.charCodeAt(0)
      );
      console.log(`   ✅ Generated ${generated} listings`);
    } else {
      console.log(`   ⏭️  Skipping generation (already has data)`);
    }

    await prisma.generatorSettings.upsert({
      where: { websiteId: website.id },
      update: { isEnabled: false, intervalMs: 5000, rowsPerTick: 1 },
      create: { websiteId: website.id, isEnabled: false, intervalMs: 5000, rowsPerTick: 1 },
    });
    console.log(`   ⚙️  Generator settings initialized (disabled by default)`);
  }

  console.log("\n✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });