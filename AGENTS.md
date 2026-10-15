# Working agreement — BEYOND

## Core rule: one small step per user request

Work incrementally. Complete **one bounded, reviewable step**, verify it, summarize the result in Thai, and stop. Wait for the user to request the next step. Do not implement the entire plan in one turn.

- “เริ่ม” authorizes the first pending step; “ต่อ”, “ถัดไป”, or “ทำต่อ” authorizes one next step only.
- A request to fix something authorizes that fix and its verification, not additional features or the next milestone.
- If a step is too large, split it into named substeps and finish only the first independently reviewable substep. Avoid arbitrary file-count limits or stopping halfway through a necessary repair.
- Finish routine implementation and repairs within the authorized step without repeatedly asking permission.
- Ask only when missing information materially blocks the step or a change would exceed its scope.
- Documentation requests do not authorize starting website development.
- A later explicit user instruction can change this workflow or authorize multiple specified steps.

## Sources and fixed scope

All paths below are relative to the actual project root, not the location of an exported copy of this file.

- Product specification: `outputs/plan.md`. For a relocated project with the plan alongside this file, use `plan.md` instead. If both exist and disagree, resolve the conflict before dependent work.
- Current implementation checkpoint: `work/progress.md`.
- Follow the latest user instruction, then these working rules and the product plan, subject to higher-priority instructions.
- Preserve the accepted scope: desktop only; no audio; Thai content with English planet names; scroll-driven spacecraft launch from Earth; seven subsequent planet stops; reversible travel; optional exploration; final route overview and replay.
- Do not add mobile controls, free-flight gameplay, accounts, a backend, extra destinations, or deployment unless requested.
- Keep the product plan stable. Record implementation progress separately; amend requirements only when the user changes them.

## Each-step workflow

1. **Resume:** Read the compact checkpoint if present. Verify relevant files and existing changes; a checkpoint is not proof that code still matches it. For a fresh project, read the plan once to understand its scope. On later steps, retrieve only relevant plan sections and files.
2. **Define:** Briefly state the step ID, intended visible result, and acceptance check. Then proceed within the user's authorization.
3. **Implement:** Make the smallest coherent change that satisfies the step. Preserve unrelated user changes. Avoid speculative abstractions, unrelated cleanup, and premature visual polish.
4. **Verify:** Run checks appropriate to the change. Correct failures caused by this step before handing it back. Distinguish implementation from verification.
5. **Record:** Update the checkpoint with actual changes, check results, remaining issues, and the next step.
6. **Report and stop:** Give a short Thai summary. Do not automatically begin the next step, create a scheduled continuation, or run more tools after the handoff.

## Suggested step queue

This queue subdivides the phases in the product plan; it does not replace their requirements. Reuse completed work. Split a row further when necessary.

| Step | Bounded deliverable | Main acceptance check |
| --- | --- | --- |
| S00 | Inspect the workspace and runtime; record setup decisions | Existing files, prerequisites, and exact next action identified; no app implementation |
| S01 | Minimal app shell and one 3D canvas | App starts and a basic scene renders |
| S02 | Placeholder ship, Earth, scroll progress, and camera path | Forward, stop, and reverse travel work |
| S03 | Launch sequence from pad through atmosphere | Continuous launch and return to the pad |
| S04 | Exploration mode for one representative planet | Enter, rotate, zoom, exit, and restore travel state |
| S05 | Reusable planet/hotspot data and inner planet scenes | Mercury, Venus, and Mars appear in order with working information |
| S06 | Jupiter and Saturn scenes | Storm/ring interactions work without breaking exploration |
| S07 | Uranus and Neptune scenes | All seven destination planets are reachable in both directions |
| S08 | Destination navigation, final overview, and replay | Jump to a destination and reset all journey state correctly |
| S09 | Consistent ship, materials, lighting, and transitions | Visual review shows a coherent journey and readable interface |
| S10 | Keyboard, reduced motion, and loading/WebGL fallbacks | Core content and controls remain accessible |
| S11 | Performance tuning on a recorded reference computer | Measure, fix observed bottlenecks, and remeasure |
| S12 | Final integrated verification and handoff | Product-plan acceptance checklist reviewed with truthful results |

Maintain basic keyboard semantics, cleanup, and performance hygiene from the start. Later stages complete and verify them rather than postponing all quality work.

## Context and token discipline

- Keep this file short; do not paste the full product plan or transcripts into it.
- Search before reading entire files. Exclude dependency folders, build output, generated assets, and lockfiles unless directly relevant.
- Batch independent targeted reads; keep edits and dependent checks sequential. Return only useful output, not entire logs.
- Reuse established decisions and existing components. Do not re-research settled choices without evidence that they changed.
- Consult current official documentation when an API, compatibility issue, or uncertain fact requires it; avoid broad research unrelated to the current step.
- Use one agent by default. Do not spawn subagents or separate chats unless explicitly authorized by the user.
- Do not invent tests or skip necessary checks merely to minimize tokens. Reduce redundant work, not correctness.
- After a check passes, rerun it only for relevant changes or unresolved concerns. Reserve the full integrated pass for S12, unless a shared-system change warrants it earlier.
- Do not retry an unchanged failing command repeatedly. Use the failure to form a specific hypothesis; if no actionable route remains, record the exact blocker and request only the missing input.
- Do not promise a specific token saving or report token usage unless it is actually available.

## Verification rules

- Documentation-only changes: verify paths, consistency, and text; do not install packages or run application tests.
- Code changes: run relevant available type/build checks and focused behavior tests. Add tests when they protect meaningful logic or regressions, not to mirror implementation.
- Visual/interaction changes: inspect the affected browser flow when tools are available. A successful build does not prove that 3D rendering or controls work.
- Camera, progress, or exploration changes: check forward/reverse travel and enter/exit restoration as relevant.
- If a required check cannot run, mark the step `needs-verification`, state why, and do not claim completion. Resolve it before dependent steps, or document the user's explicit decision to proceed.
- Never change acceptance criteria to conceal a failure. Do not overwrite or revert unrelated work.

## Compact checkpoint

Create `work/progress.md` at the first development step. Keep it approximately 40–60 lines, replacing stale detail instead of appending a diary. Record:

- Current step and status: `not-started`, `in-progress`, `needs-verification`, `blocked`, or `complete`.
- Completed step IDs, with a brief evidence reference.
- What changed in the current step and the relevant file paths.
- Commands/checks performed and their actual outcomes, including unrun checks.
- Remaining blockers or user decisions.
- Exact next step and its acceptance check.
- Reusable run commands and environment notes only when verified.

Checkpoint statuses describe local project work, not an automation or goal-tool status. Never mark the whole website complete while required acceptance checks remain unresolved.

## Thai handoff format

Use at most five short bullets by default:

- **ขั้นที่ทำ:** ID และผลลัพธ์
- **เปลี่ยนอะไร:** งานหรือไฟล์สำคัญ
- **ตรวจแล้ว:** ผลตรวจจริง
- **ค้างอยู่:** ข้อจำกัด หรือ “ไม่มีในขั้นนี้”
- **ขั้นถัดไป:** งานเดียวที่จะทำเมื่อผู้ใช้สั่งต่อ

Do not paste code, repeat the entire plan, or ask again about already accepted requirements. Stop at this handoff because the user explicitly requested step-by-step execution.
