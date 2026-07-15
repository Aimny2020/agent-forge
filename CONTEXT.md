# AgentForge Control Plane

AgentForge is a local control plane for an individual developer to prepare, launch, and observe AI coding agents in registered software projects.

## Language

**Project**:
A registered local project root that provides the canonical working directory for agent runs.
_Avoid_: Workspace copy, duplicate project

**Agent Adapter**:
A platform-aware integration that discovers, diagnoses, starts, and observes one agent surface such as Codex CLI.
_Avoid_: Agent plugin, launcher script

**Agent Installation**:
A detected local CLI executable or desktop application that provides one surface of an Agent product.
_Avoid_: Agent account, project integration

**Launch Preference**:
A personal platform-specific choice for the terminal and interaction style used to hand a project to an Agent Adapter.
_Avoid_: Project setting, command alias

**Launch Profile**:
A reusable, named combination of Agent, project context, prompt, and permission policy used for a run.
_Avoid_: Conversation, chat preset

**Run Snapshot**:
An immutable record of the project context and launch configuration used for one agent execution.
_Avoid_: Chat history, project copy

**External Handoff**:
A launch that opens an external terminal or desktop agent application; AgentForge can record the handoff but may not control the child session.
_Avoid_: Managed run

**Managed Run**:
An agent execution started and directly observed by AgentForge, including its lifecycle and exit status.
_Avoid_: External handoff
