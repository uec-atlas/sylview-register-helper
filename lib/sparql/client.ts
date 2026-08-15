const SPARQL_ENDPOINT = "https://uec-atlas.org/sparql";

export interface SparqlBinding {
  type: "uri" | "literal" | "bnode";
  value: string;
  "xml:lang"?: string;
  datatype?: string;
}

export interface SparqlResults {
  head: { vars: string[] };
  results: { bindings: Record<string, SparqlBinding>[] };
}

export class SparqlError extends Error {
  readonly status: number | null;
  readonly body: string;

  constructor(message: string, status: number | null, body: string) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "SparqlError";
  }
}

export async function query(sparql: string): Promise<SparqlResults> {
  const res = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json"
    },
    body: new URLSearchParams({ query: sparql })
  });

  if (!res.ok) {
    throw new SparqlError(
      `SPARQL request failed with status ${res.status}`,
      res.status,
      await res.text()
    );
  }

  try {
    return await res.json();
  } catch (e) {
    throw new SparqlError(
      "Failed to parse SPARQL response",
      res.status,
      e instanceof Error ? e.message : String(e)
    );
  }
}
