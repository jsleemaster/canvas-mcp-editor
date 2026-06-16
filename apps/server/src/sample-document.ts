export const sampleDocument = {
  id: "sample-file",
  name: "Sample File",
  version: 1,
  pages: [
    {
      id: "page-1",
      name: "Page 1",
      children: [
        {
          id: "frame-1",
          kind: "frame",
          name: "Landing Frame",
          children: [
            {
              id: "text-1",
              kind: "text",
              name: "Headline",
              children: [],
              transform: { x: 32, y: 40, rotation: 0 },
              size: { width: 260, height: 48 },
              style: {
                fill: "#111827",
                stroke: null,
                stroke_width: 0,
                opacity: 1
              },
              content: {
                type: "text",
                value: "Canvas MCP Editor",
                font_size: 28,
                font_family: "Inter"
              }
            }
          ],
          transform: { x: 120, y: 80, rotation: 0 },
          size: { width: 420, height: 280 },
          style: {
            fill: "#ffffff",
            stroke: "#d1d5db",
            stroke_width: 1,
            opacity: 1
          },
          content: { type: "empty" }
        }
      ]
    }
  ]
};
