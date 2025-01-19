import { pool, queryOne } from "../libs/db/pool";

async function run() {
    console.log("Start...");
    const args = process.argv.slice(2);
    const emailArg = args.find((arg) => arg.startsWith("--email="));
    const email = emailArg ? emailArg.split("=")[1] : null;
    const passArg = args.find((arg) => arg.startsWith("--pass="));
    const pass = passArg ? passArg.split("=")[1] : null;

    console.log("Email:", email);
    console.log("Pass:", pass);

    try {
        // const data = await queryOne('SELECT COUNT(*) FROM "public"."company"', []);
        // const category = await queryOne('SELECT COUNT(*) FROM "public"."category"', []);
        // const item = await queryOne('SELECT COUNT(*) FROM "public"."item"', []);
    } catch (e) {
        console.error(e);
    } finally {
        console.log("Done.");
    }
}

run();