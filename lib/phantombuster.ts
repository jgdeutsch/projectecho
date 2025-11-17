const PHANTOMBUSTER_API_KEY = process.env.PHANTOMBUSTER_API_KEY;
const AGENT_ID = "6747273483102031";
const API_BASE = "https://api.phantombuster.com/api/v2";

export interface LaunchResponse {
  containerId?: string;
  [key: string]: unknown;
}

export interface ContainerResponse {
  status: "running" | "finished" | "error";
  output?: string;
  [key: string]: unknown;
}

export async function launchPhantomAgent(
  liAt: string,
  postUrl: string
): Promise<LaunchResponse> {
  if (!PHANTOMBUSTER_API_KEY) {
    throw new Error("PHANTOMBUSTER_API_KEY is not set");
  }

  const response = await fetch(`${API_BASE}/agents/launch`, {
    method: "POST",
    headers: {
      "X-Phantombuster-Key-1": PHANTOMBUSTER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: AGENT_ID,
      argument: {
        csvName: "result",
        sessionCookie: liAt,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        postUrl: postUrl,
        removeDuplicate: false,
      },
    }),
  });

  const httpCode = response.status;
  const data = await response.json();

  return { ...data, httpCode };
}

export async function fetchContainer(
  containerId: string
): Promise<ContainerResponse & { httpCode: number }> {
  if (!PHANTOMBUSTER_API_KEY) {
    throw new Error("PHANTOMBUSTER_API_KEY is not set");
  }

  const response = await fetch(
    `${API_BASE}/containers/fetch?id=${containerId}&withOutput=true`,
    {
      headers: {
        "X-Phantombuster-Key-1": PHANTOMBUSTER_API_KEY,
      },
    }
  );

  const httpCode = response.status;
  const data = await response.json();

  return { ...data, httpCode };
}

