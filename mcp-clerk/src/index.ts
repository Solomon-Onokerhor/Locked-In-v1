import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClerkClient } from "@clerk/backend";
import { z } from "zod";

// Create Clerk Client using environment variables
// It expects CLERK_SECRET_KEY to be set
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY || "" });

// Create an MCP server
const server = new McpServer({
  name: "clerk-mcp",
  version: "1.0.0",
});

// Tool 1: List Users
server.tool(
  "clerk_list_users",
  "List Clerk users with optional filtering",
  {
    query: z.string().optional().describe("Search query by email, name, etc."),
    limit: z.number().optional().describe("Number of results to return (default 10)"),
    offset: z.number().optional().describe("Offset for pagination"),
  },
  async ({ query, limit = 10, offset = 0 }) => {
    try {
      const { data, totalCount } = await clerk.users.getUserList({
        query,
        limit,
        offset,
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ totalCount, users: data }, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error fetching users: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 2: Get User
server.tool(
  "clerk_get_user",
  "Get a specific Clerk user by ID",
  {
    userId: z.string().describe("The ID of the user to retrieve"),
  },
  async ({ userId }) => {
    try {
      const user = await clerk.users.getUser(userId);
      return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error fetching user: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 3: Update User Metadata
server.tool(
  "clerk_update_user_metadata",
  "Update a user's public or private metadata",
  {
    userId: z.string().describe("The ID of the user to update"),
    publicMetadata: z.record(z.string(), z.any()).optional().describe("Public metadata to set/merge"),
    privateMetadata: z.record(z.string(), z.any()).optional().describe("Private metadata to set/merge"),
  },
  async ({ userId, publicMetadata, privateMetadata }) => {
    try {
      const user = await clerk.users.updateUser(userId, {
        publicMetadata,
        privateMetadata,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error updating user metadata: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 4: Ban User
server.tool(
  "clerk_ban_user",
  "Ban a specific user",
  {
    userId: z.string().describe("The ID of the user to ban"),
  },
  async ({ userId }) => {
    try {
      const user = await clerk.users.banUser(userId);
      return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error banning user: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Tool 5: Unban User
server.tool(
  "clerk_unban_user",
  "Unban a specific user",
  {
    userId: z.string().describe("The ID of the user to unban"),
  },
  async ({ userId }) => {
    try {
      const user = await clerk.users.unbanUser(userId);
      return {
        content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Error unbanning user: ${error.message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Clerk MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
