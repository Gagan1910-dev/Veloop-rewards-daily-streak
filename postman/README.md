# VELoop Rewards — Postman Collection Guide

This directory contains the official Postman API collection and environment configuration for testing the VELoop Daily Streak & Authentication REST APIs.

---

## 📁 Files Included

1. **`VELOOP_Rewards_API.postman_collection.json`**:
   * Complete collection covering Health, Authentication, Daily Streak, and Security Negative tests.
   * Auto-captures JWT tokens upon successful Register/Login and sets `{{authToken}}` for subsequent requests.
2. **`VELOOP_Local.postman_environment.json`**:
   * Pre-configured environment variables for local testing (`http://localhost:5000/api`).

---

## 🚀 How to Import and Use in Postman

1. Open the **Postman** application.
2. Click **Import** in the top-left corner.
3. Drag and drop both `VELOOP_Rewards_API.postman_collection.json` and `VELOOP_Local.postman_environment.json`.
4. Select the **VELoop Local Environment** from the environment dropdown in the top right.
5. Execute requests in the following recommended order:
   * `1. Health` $\rightarrow$ `Service Health Check`
   * `2. Authentication` $\rightarrow$ `Register User` (Token is automatically saved)
   * `2. Authentication` $\rightarrow$ `Get Authenticated Profile (Me)`
   * `3. Daily Streak` $\rightarrow$ `Get Daily Streak Status`
   * `3. Daily Streak` $\rightarrow$ `Claim Daily Reward`
   * `3. Daily Streak` $\rightarrow$ `Get Streak Check-In History`
   * `4. Security & Negative Tests` $\rightarrow$ Verify tamper rejection & cooldown enforcement.
