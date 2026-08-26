declare module 'graphql-depth-limit' {
  import { ValidationContext, ASTVisitor } from 'graphql';

  type IgnoreCallback = (depth: number) => void;
  type Options = {
    ignore?: string[];
    depthAlias?: Record<string, number>;
  };

  function depthLimit(
    maxDepth: number,
    options?: Options,
    callback?: IgnoreCallback,
  ): (context: ValidationContext) => ASTVisitor;

  export = depthLimit;
}
