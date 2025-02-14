#!/usr/bin/env bash
set -e

# 1) Create venv if it doesn’t exist
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

# 2) Install Python dependencies in .venv
.venv/bin/python3 -m pip install --upgrade pip setuptools wheel
.venv/bin/python3 -m pip install -r requirements.txt

