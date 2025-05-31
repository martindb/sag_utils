#!/bin/bash

# Test script for sag_utils

# Exit immediately if a command exits with a non-zero status.
set -e

INPUT_TXT="test1.txt"
GENERATED_SAG="test1_generated.sag"
OUTPUT_TXT="test1_output.txt"

echo "Starting tests..."

# Check if input file exists
if [ ! -f "$INPUT_TXT" ]; then
    echo "Error: Input file $INPUT_TXT not found!"
    exit 1
fi

echo "1. Converting $INPUT_TXT to SAG format ($GENERATED_SAG)..."
node txt2sag.js < "$INPUT_TXT" > "$GENERATED_SAG"

# Check if generated SAG file is empty (basic check)
if [ ! -s "$GENERATED_SAG" ]; then
    echo "Error: Generated SAG file $GENERATED_SAG is empty or not created."
    rm -f "$GENERATED_SAG" # Clean up
    exit 1
fi

echo "2. Converting $GENERATED_SAG back to text format ($OUTPUT_TXT)..."
node sag2txt.js < "$GENERATED_SAG" > "$OUTPUT_TXT"

# Check if output text file is empty (basic check)
if [ ! -s "$OUTPUT_TXT" ]; then
    echo "Error: Output text file $OUTPUT_TXT is empty or not created."
    rm -f "$GENERATED_SAG" "$OUTPUT_TXT" # Clean up
    exit 1
fi

echo "3. Comparing $OUTPUT_TXT with original $INPUT_TXT..."
if diff -u "$INPUT_TXT" "$OUTPUT_TXT"; then
    echo "Success: Output matches the original input."
else
    echo "Error: Output does not match the original input. Differences found by diff."
    # diff already printed the differences
    rm -f "$GENERATED_SAG" "$OUTPUT_TXT" # Clean up
    exit 1
fi

echo "Cleaning up temporary files..."
rm -f "$GENERATED_SAG" "$OUTPUT_TXT"

echo "All tests passed successfully!"
exit 0
