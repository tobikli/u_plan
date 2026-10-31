import * as React from "react"
import { JSX, useEffect, useRef, useState } from "react"
import { BlockWithAlignableContents } from "@lexical/react/LexicalBlockWithAlignableContents"
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from "@lexical/react/LexicalDecoratorBlockNode"
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical"

const WIDGET_SCRIPT_URL = "https://platform.twitter.com/widgets.js"

type TweetComponentProps = Readonly<{
  className: Readonly<{
    base: string
    focus: string
  }>
  format: ElementFormatType | null
  loadingComponent?: JSX.Element | string
  nodeKey: NodeKey
  onError?: (error: string) => void
  onLoad?: () => void
  tweetID: string
}>

function $convertTweetElement(
  domNode: HTMLDivElement
): DOMConversionOutput | null {
  const id = domNode.getAttribute("data-lexical-tweet-id")
  if (id) {
    const node = $createTweetNode(id)
    return { node }
  }
  return null
}

let isTwitterScriptLoading = true

function TweetComponent({
  className,
  format,
  loadingComponent,
  nodeKey,
  onError,
  onLoad,
  tweetID,
}: TweetComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [loadedTweetID, setLoadedTweetID] = useState<string | null>(null)
  const isTweetLoading = loadedTweetID !== tweetID

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    const createTweet = () => {
      container.replaceChildren()
      // @ts-expect-error Twitter is attached to the window by widgets.js.
      const result: Promise<unknown> = window.twttr.widgets.createTweet(tweetID, container)
      return result.then(() => {
        if (cancelled) return
        setLoadedTweetID(tweetID)
        isTwitterScriptLoading = false
        onLoad?.()
      }, (error: unknown) => {
        if (!cancelled) onError?.(String(error))
      })
    }

    let script: HTMLScriptElement | undefined
    if (isTwitterScriptLoading) {
      script = document.createElement("script")
      script.src = WIDGET_SCRIPT_URL
      script.async = true
      script.onload = () => { if (!cancelled) void createTweet() }
      script.onerror = () => { if (!cancelled) onError?.("Could not load Twitter widgets") }
      document.body.appendChild(script)
    } else {
      void createTweet()
    }

    return () => {
      cancelled = true
      if (script) {
        script.onload = null
        script.onerror = null
        script.remove()
      }
    }
  }, [onError, onLoad, tweetID])

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      {isTweetLoading ? loadingComponent : null}
      <div
        style={{ display: "inline-block", width: "550px" }}
        ref={containerRef}
      />
    </BlockWithAlignableContents>
  )
}

export type SerializedTweetNode = Spread<
  {
    id: string
  },
  SerializedDecoratorBlockNode
>

export class TweetNode extends DecoratorBlockNode {
  __id: string

  static getType(): string {
    return "tweet"
  }

  static clone(node: TweetNode): TweetNode {
    return new TweetNode(node.__id, node.__format, node.__key)
  }

  static importJSON(serializedNode: SerializedTweetNode): TweetNode {
    const node = $createTweetNode(serializedNode.id)
    node.setFormat(serializedNode.format)
    return node
  }

  exportJSON(): SerializedTweetNode {
    return {
      ...super.exportJSON(),
      id: this.getId(),
      type: "tweet",
      version: 1,
    }
  }

  static importDOM(): DOMConversionMap<HTMLDivElement> | null {
    return {
      div: (domNode: HTMLDivElement) => {
        if (!domNode.hasAttribute("data-lexical-tweet-id")) {
          return null
        }
        return {
          conversion: $convertTweetElement,
          priority: 2,
        }
      },
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("div")
    element.setAttribute("data-lexical-tweet-id", this.__id)
    const text = document.createTextNode(this.getTextContent())
    element.append(text)
    return { element }
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__id = id
  }

  getId(): string {
    return this.__id
  }

  getTextContent(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeInert?: boolean | undefined,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeDirectionless?: false | undefined
  ): string {
    return `https://x.com/i/web/status/${this.__id}`
  }

  decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {}
    const className = {
      base: embedBlockTheme.base || "",
      focus: embedBlockTheme.focus || "",
    }
    return (
      <TweetComponent
        className={className}
        format={this.__format}
        loadingComponent="Loading..."
        nodeKey={this.getKey()}
        tweetID={this.__id}
      />
    )
  }
}

export function $createTweetNode(tweetID: string): TweetNode {
  return new TweetNode(tweetID)
}

export function $isTweetNode(
  node: TweetNode | LexicalNode | null | undefined
): node is TweetNode {
  return node instanceof TweetNode
}
