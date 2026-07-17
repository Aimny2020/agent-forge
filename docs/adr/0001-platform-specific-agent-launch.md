# Use platform-specific adapters for agent discovery and launch

AgentPalette will express agent launch intent in a platform-neutral domain model, while macOS and Windows adapters own terminal discovery, application discovery, command construction, path escaping, and process observation. This keeps the product experience consistent without incorrectly treating `open`, AppleScript, PowerShell, Windows Terminal, and native desktop applications as interchangeable.
