# MSF Marketplace Demo

## Project overview
**Problem addressed:** Online marketplaces often struggle to communicate seller reliability and listing risk to buyers, making it difficult for users to avoid fraudulent or bad-faith transactions.
**Proposed solution:** A full-stack marketplace platform featuring a calibrated risk-scoring AI model that analyzes seller history and listing attributes. Buyers are presented with clear, actionable risk assessments (Low, Medium, High risk) before making a purchase.
**Purpose of the project:** To demonstrate a practical integration of an ML-driven risk-scoring pipeline into a modern web application, including data generation, model training, and real-time backend inference.

## Features
- **Streamlined 1-Step Checkout:** Traditional stores require users to provide a phone number, enter an OTP, and then a PIN. This platform streamlines the entire process by allowing users to purchase directly at checkout using just a PIN.
- **Interactive Marketplace UI:** A responsive React frontend where users can browse listings and view detailed risk profiles for each item.
- **RESTful API Backend:** An Express.js server that enriches mock marketplace listings with AI-generated risk scores before serving them to the client.
- **AI-Powered Risk Scoring:** A robust machine learning model that uses continuous behavioral signals (like success rates and price deviations) rather than simple heuristics to predict if a listing is suspicious. 
- **Synthetic Data Generation Pipeline:** Built-in Python scripts to procedurally generate realistic, overlapping datasets for training and testing the model.

## Technology stack
- **Frontend:** React 19, Vite, TailwindCSS v4, Lucide React
- **Backend:** Node.js, Express.js, cors, csv-parser
- **AI / Machine Learning:** Python 3, scikit-learn (`HistGradientBoostingClassifier`, `CalibratedClassifierCV`), pandas, numpy, joblib
- **Linting:** Oxlint (for lightning-fast React Hooks/JavaScript linting)

## Requirements
To run this project locally, you will need:
- Node.js (v18.0.0 or higher)
- npm (Node Package Manager)
- Python (v3.9 or higher)
- Unix-like environment (Linux/macOS or WSL on Windows) for the bash run scripts

## Installation and setup
Follow these step-by-step instructions to set up the project locally:

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd msf-marketplace-demo
   ```

2. **Install frontend and backend dependencies:**
   ```bash
   # Install API dependencies
   cd server
   npm install

   # Install Client dependencies
   cd ../client
   npm install
   cd ..
   ```

3. **Set up the Python environment (for the AI model):**
   ```bash
   # Create a virtual environment
   python3 -m venv .venv
   
   # Activate the virtual environment
   source .venv/bin/activate
   
   # Install required ML packages
   pip install scikit-learn pandas joblib
   ```

## Environment variables
Currently, the application requires minimal environment configuration. If you wish to override default ports, you can use the following:

- `PORT` - The port on which the Express server runs (Default: `4000`)
- `VITE_API_URL` - The URL where the frontend expects to find the backend API (Default: `http://localhost:4000`)

*Note: Use placeholders (e.g. `<YOUR_API_KEY>`) if you adapt this project to use external services.*

## Run and build commands
The repository contains convenience scripts to easily run both the frontend and backend simultaneously.

- **Start Development Server (Frontend + Backend):**
  From the repository root, run:
  ```bash
  npm run dev
  ```
  *This will start the Express API on port 4000 and the Vite development server simultaneously.*

- **Run Backend only:**
  ```bash
  npm run start --prefix server
  ```

- **Run Frontend only:**
  ```bash
  npm run dev --prefix client
  ```

- **Build Frontend for Production:**
  ```bash
  npm run build --prefix client
  ```
  *The output will be placed in `client/dist/`.*

## Live deployment URL
[Insert Live Deployment URL Here]

## Testing instructions
There are currently no automated unit test suites, but you can verify functionality by doing the following:

1. **Lint the codebase:**
   Ensure the frontend adheres to standard React and syntax guidelines using Oxlint:
   ```bash
   npm run lint --prefix client
   ```
2. **Manual Verification Flow:**
   - Run `npm run dev` in the root.
   - Navigate to the local URL provided by Vite (e.g., `http://localhost:5173`).
   - Verify that marketplace listings appear on the screen.
   - Click on different listings to ensure that the Risk Model accurately categorizes listings (Low/Medium/High).

## Other configuration
If you want to modify the AI's behavior or generate new data, you can use the included Python scripts (ensure your `.venv` is activated):

- **Regenerate Synthetic Data:**
  To generate the training dataset (seed 42):
  ```bash
  python generate_seller_dataset.py --rows 100000 --seed 42 --out risk_training_100000.csv
  ```
  To generate the store listing dataset (seed 1337):
  ```bash
  python generate_seller_dataset.py --rows 3000 --seed 1337 --out store_listings_3000.csv --drop-target
  ```
- **Retrain the Risk Model:**
  ```bash
  python train_risk_model.py --input risk_training_100000.csv --model-out server/risk_model.joblib
  ```
  *(See `new_model/seller_risk_model.py` for advanced CLI usage regarding model inference.)*