# Sqlite3 for typescript (deno)

usage:

```
import { DB, init } from "https://deno.land/x/sqlite3_wasm/mod.ts";
// another vfs implemention is vfs.map.ts
// note you can only use one vfs at the same time
import denovfs from "https://deno.land/x/sqlite3_wasm/vfs.deno.ts";

init(denovfs);

const db = new DB("test.db");
db.exec("DROP TABLE IF EXISTS t");
db.exec("CREATE TABLE t(key TEXT PRIMARY KEY, value INT)");

db.exec("INSERT INTO t VALUES(?, ?)", ["test", 2333]);
const stmt = db.prepare("SELECT * FROM t");
for (const item of stmt.query({})) {
  console.log(item);
}
```