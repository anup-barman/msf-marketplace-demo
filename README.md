# MSF Marketplace Demo

## Project overview
**Problem addressed:** Online marketplaces often struggle to communicate seller reliability and listing risk to buyers, making it difficult for users to avoid fraudulent or bad-faith transactions.
**Proposed solution:** A full-stack marketplace platform featuring a calibrated risk-scoring AI model that analyzes seller history and listing attributes. Buyers are presented with clear, actionable risk assessments (Low, Medium, High risk) before making a purchase.
**Purpose of the project:** To demonstrate a practical integration of an ML-driven risk-scoring pipeline into a modern web application, including data generation, model training, and real-time backend inference.

## Features
- **Streamlined 1-Step Checkout:** Traditional stores require users to provide a phone number, enter an OTP, and then a PIN. This platform streamlines the entire process by allowing users to purchase directly at checkout using just a PIN (demo PIN: `1234`).
- **Interactive Marketplace UI:** A responsive React frontend where users can browse listings and view detailed risk profiles for each item.
- **Live PostgreSQL Marketplace:** The Upay store reads current listings from the three seller websites, which share PostgreSQL and generate new items when their generators are enabled.
- **API Route Handlers:** Next.js route handlers (`app/api/**`) that enrich live generated listings with risk predictions from the trained model before serving them to the client.
- **AI-Powered Risk Scoring:** A robust machine learning model that uses continuous behavioral signals (like success rates and price deviations) rather than simple heuristics to predict if a listing is suspicious. 
- **Synthetic Data Generation Pipeline:** Built-in Python scripts to procedurally generate realistic, overlapping datasets for training and testing the model.

## Technology stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **UI:** TailwindCSS v4, Lucide React
- **Server:** Next.js route handlers on Node.js, live seller APIs
- **AI / Machine Learning:** Python 3, scikit-learn (`HistGradientBoostingClassifier`, `CalibratedClassifierCV`), pandas, numpy, joblib
- **Linting:** Oxlint + `tsc --noEmit`

## Project layout
```
app/            layout, page, global CSS, and API route handlers (app/api/**/route.ts)
components/     client UI (StoreApp.tsx owns app state; screens and modals)
lib/            live dataset loading, risk enrichment, better-deal logic, shared types
data/           trained model and metadata (risk-model.json, risk_model.joblib)
new_model/      risk model training / inference module
public/         static assets
```

## Requirements
To run this project locally, you will need:
- Node.js (v20.9.0 or higher)
- npm (Node Package Manager)
- Python (v3.9 or higher) — required for live risk-model inference; also used to regenerate training data or retrain the model

## Installation and setup
Follow these step-by-step instructions to set up the project locally:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd upay-smart-store
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the Python environment for live model inference:**
   ```bash
   # Create a virtual environment
   python3 -m venv .venv
   
   # Activate the virtual environment
   source .venv/bin/activate
   
   # Install required model packages
   pip install -r new_model/requirements.txt
   ```

## Environment variables
The Upay store and marketplace network dashboard read listings, stats, and generator state from the three seller APIs. The defaults keep this app on port `3000` and expect the seller sites on `3001`, `3002`, and `3003`. Copy `.env.example` to `.env.local` to override their base URLs. Store listings refresh every five seconds, and the trained model scores each new batch live:

- `NEXT_PUBLIC_WEBSITE_A_URL` - Small seller website (default `http://localhost:3001`)
- `NEXT_PUBLIC_WEBSITE_B_URL` - Medium seller website (default `http://localhost:3002`)
- `NEXT_PUBLIC_WEBSITE_C_URL` - Enterprise seller website (default `http://localhost:3003`)

No API credentials are required. The dashboard is available at `/dashboard`, refreshes every five seconds, and lets you view the combined feed or filter by seller scale. It also provides individual generator controls and a toggle-all action.

## Run and build commands
The UI and API run in a single Next.js app.

- **Start Development Server:**
  ```bash
  npm run dev:aggregator
  ```
  *Open `http://localhost:3000`. The live shop catalog and APIs are served from the same origin under `/api`.*

  Start the three seller website APIs separately on ports `3001`, `3002`, and `3003`.

- **Build for Production:**
  ```bash
  npm run build
  ```

- **Run the Production Build:**
  ```bash
  npm run start
  ```
  *Runs as a long-lived Node server. The demo balance is kept in memory and resets when the server restarts.*

## Live deployment URL
[Insert Live Deployment URL Here]

## Testing instructions
There are currently no automated unit test suites, but you can verify functionality by doing the following:

1. **Lint the codebase:**
   Run Oxlint and the TypeScript type checker:
   ```bash
   npm run lint
   ```
2. **Manual Verification Flow:**
   - Run `npm run dev` in the root.
   - Navigate to `http://localhost:3000`.
   - Verify that live PostgreSQL generator listings appear in the Upay store and refresh every five seconds.
   - Click on different listings to ensure that the Risk Model accurately categorizes listings (Low/Medium/High).

## Other configuration
If you want to modify the AI's behavior or generate new data, you can use the included Python scripts (ensure your `.venv` is activated):

- **Regenerate Synthetic Data:**
  To generate the training dataset (seed 42):
  ```bash
  python generate_seller_dataset.py --rows 100000 --seed 42 --out risk_training_100000.csv
  ```
- **Retrain the Risk Model:**
  ```bash
  python train_risk_model.py --input risk_training_100000.csv
  ```
  *Writes `data/risk_model.joblib`, `data/risk-model.json`, and `data/risk-scores.json`. The Upay store uses `risk_model.joblib` to score refreshed live generator listings; restart Next.js after replacing the model.*
  *(See `new_model/seller_risk_model.py` for advanced CLI usage regarding model inference.)*
