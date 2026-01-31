#!/bin/bash
set -e

# Define paths
CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
SOURCE_DIR="$CURRENT_DIR/newsletter"
TARGET_DIR="$PARENT_DIR/edc-newsletter"

echo "🚀 Starting migration of Newsletter app..."

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: 'newsletter' folder not found in current directory."
    exit 1
fi

# Check if target already exists
if [ -d "$TARGET_DIR" ]; then
    echo "⚠️  Warning: Target directory '$TARGET_DIR' already exists."
    echo "Aborting to prevent overwriting."
    exit 1
fi

echo "📦 Moving 'newsletter' folder to '$TARGET_DIR'..."
mv "$SOURCE_DIR" "$TARGET_DIR"

echo "✅ Folder moved."
echo "🔧 Initializing new Git repository..."

cd "$TARGET_DIR"
git init
git add .
git commit -m "Initial commit: Migrated newsletter app to separate repository"

echo "--------------------------------------------------------"
echo "🎉 Local migration complete!"
echo ""
echo "NEXT STEPS for you:"
echo "1. Create a new repository on GitHub (e.g., 'edc-newsletter')."
echo "2. Run the following commands in this terminal window:"
echo ""
echo "   cd \"$TARGET_DIR\""
echo "   git remote add origin https://github.com/mignac71/edc-newsletter.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Finally, update Vercel Project Settings to connect to this new repo."
echo "--------------------------------------------------------"
