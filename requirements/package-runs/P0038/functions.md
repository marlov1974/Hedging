# P0038 Function Design

## New functions

- `componentCodeConcept(component)`
  - Purpose: classify a component-like string as canonical, projected, compatibility alias, reserved or unknown adjustment.
  - Inputs: component code string.
  - Outputs: component concept string.
  - Side effects: none.
  - Tests: database component-code tests.

- `isCanonicalSourceOfTruthComponentCode(component)`
  - Purpose: report whether a component is a canonical persisted source-of-truth code.
  - Inputs: component code string.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: database component-code tests.

- `isProjectedOnlyComponentCode(component)`
  - Purpose: report whether a component is projected/view-only.
  - Inputs: component code string.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: database component-code tests.

- `isCompatibilityAliasComponentCode(component)`
  - Purpose: report whether a component is a deprecated compatibility alias.
  - Inputs: component code string.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: alias behavior tests.

- `isReservedComponentCode(component)`
  - Purpose: report whether a component is known but outside current canonical Peaks source-of-truth scope.
  - Inputs: component code string.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: reserved metadata tests.

- `isPersistableComponentCode(component)`
  - Purpose: report whether a component code may be used in persisted product component configuration.
  - Inputs: component code string.
  - Outputs: boolean.
  - Side effects: none.
  - Tests: validation tests.

- `assertPersistableComponentCode(component)`
  - Purpose: reject unknown and projected-only component codes at persisted metadata insertion seams.
  - Inputs: component code string.
  - Outputs: void or `DatabaseError`.
  - Side effects: none.
  - Tests: repository insertion tests.

## Changed functions

- `assertKnownComponentCode`
  - Reason: delegate to source-of-truth helper and remove local duplicate known-code list.
  - Behavior: continues to allow canonical, alias and reserved persisted metadata; rejects projected-only and unknown codes.

## Removed functions

None.
