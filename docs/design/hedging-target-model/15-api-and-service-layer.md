# API and service layer

## Purpose of this section

Explain how the target model should be exposed to other systems as a service/API, not understood primarily as a UI.

## Notes and requirements for the section

- State that the PoC UI is only a demonstration surface.
- Explain that the target solution should support system-to-system interaction.
- Cover read APIs and write APIs conceptually.
- Cover backward-compatible Classic interfaces.
- Explain that API formats can be projections over canonical data.
- Avoid internal system names.

## Current version of the text

The target solution should be understood as a domain service. The PoC may have a UI, but the important long-term capability is that other systems can create calloffs, request projections, read positions and retrieve settlement views through stable service interfaces.

The API layer should expose commands such as Baseloads calloff, Modern/Peaks calloff, market rebalance and customer conversion. It should also expose read models such as Modern view, Classic view, Baseloads view, market basis position, transaction lists, position reports and settlement reports.

Existing Classic-facing interfaces must remain supported during migration. This compatibility should be handled at the API/projection boundary while the internal model moves toward event details, legs, components and canonical/projection separation.
