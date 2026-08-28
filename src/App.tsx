import { useWebMCP } from '@mcp-b/react-webmcp';

function App() {
  useWebMCP({
    name: 'ping_test',
    description: 'A test tool to confirm WebMCP tool registration is working',
    inputSchema: {},
    execute: async () => {
      return { success: true, message: 'pong' };
    },
  });

  return (
    <div>
      <h1>AccessCanary</h1>
      <p>WebMCP tool test — check the Tool Inspector extension</p>
    </div>
  );
}

export default App;