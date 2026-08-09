
async function run() {
  const args = process.argv.slice(2);
  const emailArg = args.find(arg => arg.startsWith('--email='));
  const _email = emailArg ? emailArg.split('=')[1] : null;
  const passArg = args.find(arg => arg.startsWith('--pass='));
  const _pass = passArg ? passArg.split('=')[1] : null;

  try {
    // const data = await queryOne('SELECT COUNT(*) FROM "public"."company"', []);
    // const category = await queryOne('SELECT COUNT(*) FROM "public"."category"', []);
    // const item = await queryOne('SELECT COUNT(*) FROM "public"."item"', []);
  } catch {
  } finally {
  }
}

run();
