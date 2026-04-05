import { fetchBackendState } from "./utils/http-client.mjs";

export async function createRuntimeContext(input) {
  const existing = await fetchBackendState(input.baseUrl);
  return {
    bundleId: input.bundleId,
    bundlePath: input.bundlePath,
    bundleDir: input.bundleDir,
    bundle: input.bundle,
    baseUrl: input.baseUrl,
    dryRun: Boolean(input.dryRun),
    existing,
    computed: {},
    execution: {
      created: {
        skills: [],
        skillLists: [],
        agents: [],
        projectId: null,
        workflowTemplateId: null,
        workflowRunId: null
      },
      steps: [],
      rollback: []
    }
  };
}
