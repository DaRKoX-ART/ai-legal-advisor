const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ---------------------------------------------------------------------------
// @supabase/supabase-js v2.106+ ships an ESM bundle that contains
//
//   const OTEL_PKG = "@opentelemetry/api";
//   ... = import(/* @vite-ignore */ OTEL_PKG).catch(() => null);
//
// for optional OpenTelemetry integration. Hermes (RN 0.81) rejects the
// dynamic-import-of-a-variable form during bytecode compilation and the
// production build fails. The CJS bundle of the same package uses
// `require(s).catch(...)` which Metro+Hermes tolerate, and the runtime
// catch transparently handles the missing `@opentelemetry/api` module.
//
// Force-resolve `@supabase/supabase-js` to its CJS variant. Surgical to a
// single package; everything else continues to use whatever Metro picks.
// ---------------------------------------------------------------------------
const supabaseJsCjs = require.resolve(
  "@supabase/supabase-js/dist/index.cjs",
);

const previousResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@supabase/supabase-js") {
    return { filePath: supabaseJsCjs, type: "sourceFile" };
  }
  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
