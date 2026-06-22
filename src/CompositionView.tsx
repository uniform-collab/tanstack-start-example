import {
  UniformComponent,
  UniformCompositionContext,
  UniformCompositionProps,
  useUniformCurrentComposition,
} from "@uniformdev/canvas-react";
import { ComponentInstanceContextualEditing } from "@uniformdev/canvas";
import { PureContextualEditingComponentWrapper } from "@uniformdev/canvas-react/core";
import { resolveRenderer } from "./components";
import { ComponentInstance, isComponentPlaceholderId } from "@uniformdev/canvas";
import { RootComponentInstance } from "@uniformdev/canvas";

export function CompositionView({
  data,
  contextualEditingDefaultPlaceholder,
  children,
  draft = false,
}: UniformCompositionProps & {
  draft: boolean;
}) {
  const behaviorTracking: UniformCompositionProps["behaviorTracking"] = "onLoad";
  return (
    <UniformCompositionContext.Provider
      value={{
        data,
        behaviorTracking,
        resolveRenderer,
        isContextualEditing: draft,
      }}
    >
      <ContextualEditingComponentWrapper component={data}>
        <UniformComponent
          data={data}
          behaviorTracking={behaviorTracking}
          resolveRenderer={resolveRenderer}
          contextualEditingDefaultPlaceholder={contextualEditingDefaultPlaceholder}
        >
          {children}
        </UniformComponent>
      </ContextualEditingComponentWrapper>
    </UniformCompositionContext.Provider>
  );
}

export type ContextualEditingWrapperProps = {
  component?: ComponentInstance | RootComponentInstance;
  parentComponent?: ComponentInstance;
  slotName?: string;
  indexInSlot?: number;
  slotChildrenCount?: number;
  emptyPlaceholder?: React.ReactNode;
  children: React.ReactNode;
};

/** Wraps the children (typically a UniformComponent) with some script tags to allow interacting with it in contextual editing mode */
export function ContextualEditingComponentWrapper({
  component,
  parentComponent,
  slotName,
  indexInSlot,
  slotChildrenCount,
  emptyPlaceholder,
  children,
}: ContextualEditingWrapperProps) {
  const isPlaceholder = isComponentPlaceholderId(component?._id);
  const { isContextualEditing } = useUniformCurrentComposition();
  const isReadOnly = (component as ComponentInstanceContextualEditing | undefined)?._contextualEditing
    ?.isEditable
    ? undefined
    : "true";

  if (!isContextualEditing) {
    return <>{children}</>;
  }

  if (isPlaceholder && emptyPlaceholder === null) {
    return null;
  }

  return (
    <PureContextualEditingComponentWrapper
      isPlaceholder={isPlaceholder}
      parentComponent={parentComponent}
      component={component as ComponentInstance}
      slotName={slotName}
      indexInSlot={indexInSlot}
      slotChildrenCount={slotChildrenCount}
      isReadOnly={isReadOnly}
    >
      {isPlaceholder && emptyPlaceholder !== undefined ? emptyPlaceholder : children}
    </PureContextualEditingComponentWrapper>
  );
}
