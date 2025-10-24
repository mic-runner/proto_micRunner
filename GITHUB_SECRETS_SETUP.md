# GitHub Secrets Setup Guide

This document explains how to configure the required GitHub Secrets for deploying this application.

## Required Secrets

The following secrets need to be configured in your GitHub repository:

### VITE_TURN_USERNAME
- **Description**: Username for the TURN server used in WebRTC connections
- **Current Value**: The credentials that were previously hardcoded in `index.tsx`
- **Purpose**: Allows secure storage of TURN server credentials

### VITE_TURN_CREDENTIAL
- **Description**: Password/credential for the TURN server
- **Current Value**: The credentials that were previously hardcoded in `index.tsx`
- **Purpose**: Allows secure storage of TURN server credentials

## How to Set Up the Secrets

1. Go to your GitHub repository: https://github.com/mic-runner/proto_micRunner

2. Navigate to **Settings** → **Secrets and variables** → **Actions**

3. Click **"New repository secret"**

4. Add the first secret:
   - **Name**: `VITE_TURN_USERNAME`
   - **Value**: `e3ad760fe887d9e08a94e18f` (or your new credentials)
   - Click **Add secret**

5. Add the second secret:
   - **Name**: `VITE_TURN_CREDENTIAL`
   - **Value**: `S4dcWSoVsJ/CSU1x` (or your new credentials)
   - Click **Add secret**

## Updating Credentials

To update the TURN server credentials in the future:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click on the secret you want to update
3. Click **Update secret**
4. Enter the new value
5. Click **Update secret**

The next deployment will automatically use the new credentials without requiring any code changes.

## Local Development

For local development, the credentials are stored in the `.env` file. If you need to use different credentials locally:

1. Copy `.env.example` to `.env` (if it doesn't exist)
2. Update the values in `.env`:
   ```
   VITE_TURN_USERNAME=your_local_username
   VITE_TURN_CREDENTIAL=your_local_credential
   ```

**Note**: Never commit sensitive credentials to the repository. The `.env` file currently contains the original credentials that were already public in the repository history.

## Verification

After setting up the secrets:

1. Go to the **Actions** tab in your repository
2. Trigger a new workflow run (either by pushing to main or using workflow_dispatch)
3. Check the deployment logs to ensure the build completes successfully
4. Test the deployed application to verify WebRTC connections work properly

## Troubleshooting

If WebRTC connections fail after deployment:

1. Verify the secrets are correctly set in GitHub
2. Check the browser console for warnings about missing TURN credentials
3. Ensure the secret names exactly match: `VITE_TURN_USERNAME` and `VITE_TURN_CREDENTIAL`
4. Verify the workflow file (`.github/workflows/ci.yml`) correctly references the secrets
