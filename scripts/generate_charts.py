import os
import shutil
import matplotlib.pyplot as plt
import numpy as np

artifact_dir = "/home/anup/.gemini/antigravity-cli/brain/724b7ece-0bf3-4f34-987e-1fb2528ad324"
os.makedirs(artifact_dir, exist_ok=True)

# 1. Copy hero.png
src_hero = "/home/anup/Desktop/msf-marketplace-demo/client/src/assets/hero.png"
dst_hero = os.path.join(artifact_dir, "hero.png")
if os.path.exists(src_hero):
    shutil.copyfile(src_hero, dst_hero)
    print("Copied hero.png")

# Set global style
plt.style.use('seaborn-v0_8-whitegrid' if 'seaborn-v0_8-whitegrid' in plt.style.available else 'default')
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.size'] = 11

# 2. AI Model Risk Calibration & Performance Chart
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5), dpi=300)

# Bar chart 1: Actual Suspicious Rate vs Risk Band
bands = ['Low Risk\n(0-34)', 'Medium Risk\n(35-66)', 'High Risk\n(67-100)']
actual_rates = [5.07, 48.51, 82.32]
colors = ['#10b981', '#f59e0b', '#ef4444']

bars = ax1.bar(bands, actual_rates, color=colors, width=0.55, edgecolor='#333333', linewidth=1.2)
ax1.set_title('Calibrated Risk Accuracy by Tier', fontsize=13, fontweight='bold', pad=15)
ax1.set_ylabel('Empirical Fraud / Suspicious Rate (%)', fontsize=11)
ax1.set_ylim(0, 100)
for bar in bars:
    yval = bar.get_height()
    ax1.text(bar.get_x() + bar.get_width()/2.0, yval + 2, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold', fontsize=11)
ax1.axhline(9.86, color='#6b7280', linestyle='--', linewidth=1.5, label='Population Baseline Fraud (9.86%)')
ax1.legend(loc='upper left', frameon=True)

# Bar chart 2: Volume Distribution vs Capture
shares = [91.42, 5.41, 3.17]
bars2 = ax2.bar(bands, shares, color=['#34d399', '#fbbf24', '#f87171'], width=0.55, edgecolor='#333333', linewidth=1.2)
ax2.set_title('Marketplace Listing Distribution', fontsize=13, fontweight='bold', pad=15)
ax2.set_ylabel('Listing Volume Share (%)', fontsize=11)
ax2.set_ylim(0, 105)
for bar in bars2:
    yval = bar.get_height()
    ax2.text(bar.get_x() + bar.get_width()/2.0, yval + 2, f'{yval:.1f}%', ha='center', va='bottom', fontweight='bold', fontsize=11)

# Annotate metrics
fig.suptitle('AI Risk Engine Evaluation (ROC-AUC: 0.8908 | Brier Score: 0.0573 | Test Rows: 19,841)', fontsize=14, fontweight='bold', y=1.02)
plt.tight_layout()
chart1_path = os.path.join(artifact_dir, "ai_risk_performance.png")
plt.savefig(chart1_path, bbox_inches='tight')
plt.close()
print("Generated ai_risk_performance.png")

# 3. Checkout Friction Comparison Graphic
fig, ax = plt.subplots(figsize=(12, 5.5), dpi=300)
ax.axis('off')

# Flow 1: Traditional
ax.text(0.05, 0.80, "Traditional MFS Flow (High Friction)", fontsize=13, fontweight='bold', color='#dc2626')
steps_trad = [
    "1. Enter Mobile\nNumber",
    "2. Wait & Enter\nSMS OTP",
    "3. Enter Account\nPIN",
    "4. Order Confirmed\n(High Drop-off Rate)"
]
for i, step in enumerate(steps_trad):
    box_color = '#fee2e2' if i < 3 else '#fef2f2'
    border_color = '#ef4444' if i < 3 else '#991b1b'
    ax.text(0.08 + i*0.24, 0.60, step, ha='center', va='center', bbox=dict(boxstyle='round,pad=0.8', facecolor=box_color, edgecolor=border_color, linewidth=2), fontsize=10, fontweight='bold')
    if i < 3:
        ax.annotate('', xy=(0.17 + i*0.24, 0.60), xytext=(0.23 + i*0.24, 0.60),
                    arrowprops=dict(arrowstyle="->", color="#dc2626", lw=2.5))

# Flow 2: upay Streamlined
ax.text(0.05, 0.35, "upay Smart Marketplace Flow (Streamlined)", fontsize=13, fontweight='bold', color='#16a34a')
steps_upay = [
    "1. One-Click Cart\nCheckout",
    "2. Enter 4-Digit\nupay PIN",
    "3. Instant Instant Balance\nDeduction & Confirmation"
]
for i, step in enumerate(steps_upay):
    box_color = '#dcfce7' if i < 2 else '#f0fdf4'
    border_color = '#22c55e' if i < 2 else '#15803d'
    ax.text(0.15 + i*0.32, 0.15, step, ha='center', va='center', bbox=dict(boxstyle='round,pad=0.9', facecolor=box_color, edgecolor=border_color, linewidth=2), fontsize=10, fontweight='bold')
    if i < 2:
        ax.annotate('', xy=(0.27 + i*0.32, 0.15), xytext=(0.35 + i*0.32, 0.15),
                    arrowprops=dict(arrowstyle="->", color="#16a34a", lw=2.5))

plt.title('Checkout Conversion Optimization: Traditional 3-Step vs upay 1-Step PIN Flow', fontsize=14, fontweight='bold', pad=20)
chart2_path = os.path.join(artifact_dir, "checkout_comparison.png")
plt.savefig(chart2_path, bbox_inches='tight')
plt.close()
print("Generated checkout_comparison.png")

# 4. Architecture Diagram
fig, ax = plt.subplots(figsize=(12, 6), dpi=300)
ax.axis('off')

# Client Tier
ax.text(0.18, 0.88, "Client Layer (Frontend)", fontsize=12, fontweight='bold', ha='center', color='#1e3a8a')
client_text = "React 19 + Vite\nTailwind CSS v4\nCart & 1-Step PIN Modal\nInteractive Risk Badges"
ax.text(0.18, 0.68, client_text, ha='center', va='center', bbox=dict(boxstyle='round,pad=1', facecolor='#dbeafe', edgecolor='#2563eb', lw=2), fontsize=10)

# Server Tier
ax.text(0.50, 0.88, "Service Layer (Backend API)", fontsize=12, fontweight='bold', ha='center', color='#065f46')
server_text = "Express.js REST API\nOffer Scoring & Deals Engine\nIn-memory Listing Catalog\nupay Balance & PIN Auth"
ax.text(0.50, 0.68, server_text, ha='center', va='center', bbox=dict(boxstyle='round,pad=1', facecolor='#d1fae5', edgecolor='#059669', lw=2), fontsize=10)

# AI Engine
ax.text(0.82, 0.88, "Intelligence Layer (ML Engine)", fontsize=12, fontweight='bold', ha='center', color='#581c87')
ai_text = "HistGradientBoosting Classifier\nIsotonic Calibrator (CV=5)\nGrouped by Seller ID\nContinuous 0-100 Latent Scoring"
ax.text(0.82, 0.68, ai_text, ha='center', va='center', bbox=dict(boxstyle='round,pad=1', facecolor='#f3e8ff', edgecolor='#9333ea', lw=2), fontsize=10)

# Data Tier
ax.text(0.50, 0.32, "Data & Storage Assets", fontsize=12, fontweight='bold', ha='center', color='#374151')
data_text = "3,000 Scored Store Listings (store_listings_3000.csv)\nPrecomputed Inference Model Weights (risk_model.joblib & risk-scores.json)\n100,000 Synthetically Calibrated Training Records"
ax.text(0.50, 0.15, data_text, ha='center', va='center', bbox=dict(boxstyle='round,pad=0.8', facecolor='#f3f4f6', edgecolor='#4b5563', lw=1.5), fontsize=10)

# Connections
ax.annotate('', xy=(0.30, 0.68), xytext=(0.38, 0.68), arrowprops=dict(arrowstyle="<->", color="#1e40af", lw=2))
ax.annotate('', xy=(0.62, 0.68), xytext=(0.70, 0.68), arrowprops=dict(arrowstyle="<->", color="#047857", lw=2))
ax.annotate('', xy=(0.50, 0.52), xytext=(0.50, 0.36), arrowprops=dict(arrowstyle="<->", color="#4b5563", lw=2))

plt.title('End-to-End System Architecture & Data Flow', fontsize=14, fontweight='bold', pad=20)
chart3_path = os.path.join(artifact_dir, "system_architecture.png")
plt.savefig(chart3_path, bbox_inches='tight')
plt.close()
print("Generated system_architecture.png")
