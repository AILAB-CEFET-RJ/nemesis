#!/bin/bash
conda activate nemesis
python -m uvicorn main:app --reload
