# Architecture

## High-Level Overview

```
User runs CLI command
        │
        ▼
  ┌─────────────┐
  │  Commander   │  CLI framework — parses args, routes to commands
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  Commands    │  inspect, generate, init, deploy, doctor
  └──────┬──────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌──────────┐
│Detector│ │Generators│
└───┬────┘ └────┬─────┘
    │           │
    │     ┌─────┴──────┐
    │     ▼            ▼
    │  ┌────────┐  ┌──────────┐
    │  │Templates│  │ Renderer │
    │  └────────┘  └──────────┘
    │
    ▼
┌──────────┐
│  Output  │  Logger, Spinner, File Writer
└──────────┘
```

## Key Design Decisions

### 1. Micro Template Engine
Instead of depending on Handlebars (115KB), we use a custom renderer that supports `{{var}}`, `{{#if}}`, `{{#each}}`, and `{{#unless}}`. This keeps the package small and dependency-free for the core rendering logic.

### 2. Confidence-Based Detection
Each detector returns a confidence score (0-100). The detector with the highest confidence wins. This gracefully handles projects that might have artifacts from multiple stacks.

### 3. Generator Orchestrator Pattern
Generators are independent and composable. The orchestrator runs all generators and collects results. This makes it trivial to add/remove generators.

### 4. Safe File Operations
All file writes go through `safeWriteFile()` which:
- Checks if file exists
- Creates a `.bak` backup if overwriting
- Supports dry-run mode
- Creates parent directories automatically

### 5. Provider Architecture
Even though deployment is stub-only in MVP, the `DeployProvider` interface is defined to make future integration straightforward. Each provider implements `deploy(rootDir, config)`.

## Data Flow

```
detect(rootDir) → ProjectInfo { primary: DetectionResult }
                          │
                          ▼
buildContext(rootDir, detection) → GeneratorContext { projectName, stack, port }
                          │
                          ▼
generateAll(context) → GeneratedFile[] { relativePath, content }
                          │
                          ▼
writeGeneratedFiles(rootDir, files, options) → WriteResult[] { path, action }
```
