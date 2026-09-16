type Registry = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function registerExhibitionTools(actions: {
  list: () => unknown;
  open: (id: number) => void;
}) {
  const context = (document as Document & { modelContext?: Registry })
    .modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools = [
    {
      name: 'list_exhibition_startups',
      description:
        'Read the eleven startup names, sectors and booth numbers in the exhibition.',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute: () => actions.list(),
    },
    {
      name: 'open_startup_profile',
      description:
        'Open the company profile panel for a numbered startup booth in the exhibition.',
      inputSchema: {
        type: 'object',
        properties: { booth: { type: 'integer', minimum: 1, maximum: 11 } },
        required: ['booth'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute: async (input: unknown) => {
        const booth = (input as { booth?: unknown })?.booth;
        if (
          typeof booth !== 'number' ||
          !Number.isInteger(booth) ||
          booth < 1 ||
          booth > 11
        )
          throw new Error('booth must be an integer from 1 to 11');
        actions.open(booth);
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        );
        return { opened: true, booth };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {}
  }
  return () => lifecycle.abort();
}
