import "./styles.css";

import React, { useEffect, useRef, useState } from "react";
import { useDidUpdateEffect } from "./use-did-update-effect";

import cc from "./classnames";
import Tag from "./tag";

const userAgent = navigator.userAgent.toLowerCase();
const isMac = userAgent.indexOf('mac') !== -1;

export interface TagsInputProps {
  name?: string;
  placeHolder?: string;
  value?: string[];
  onChange?: (tags: string[]) => void;
  onBlur?: any;
  separators?: string[];
  disableBackspaceRemove?: boolean;
  onExisting?: (tag: string) => void;
  onRemoved?: (tag: string) => void;
  disabled?: boolean;
  isEditOnRemove?: boolean;
  beforeAddValidate?: (tag: string, existingTags: string[]) => boolean;
  onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  classNames?: {
    input?: string;
    tag?: string;
  };
  disableUndoRedo?: boolean;
}

const defaultSeparators = ["Enter"];

export const TagsInput = ({
  name,
  placeHolder,
  value,
  onChange,
  onBlur,
  separators,
  disableBackspaceRemove,
  onExisting,
  onRemoved,
  disabled,
  isEditOnRemove,
  beforeAddValidate,
  onKeyUp,
  classNames,
  disableUndoRedo = false,
}: TagsInputProps) => {
  const [tags, setTags] = useState<any>(value || []);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useDidUpdateEffect(() => {
    onChange && onChange(tags);
  }, [tags]);

  useDidUpdateEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(tags)) {
      setTags(value);
    }
  }, [value]);

  useEffect(() => {
    setHistory([tags]);
    setHistoryIndex(0);
  }, []);

  const updateHistory = (newTags) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTags);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const maybeSetTags = (text: string, e) => {
    if (beforeAddValidate && !beforeAddValidate(text, tags)) return;

    if (tags.includes(text)) {
      onExisting && onExisting(text);
      return;
    }

    const newTags = [...tags, text];
    setTags(newTags);
    updateHistory(newTags);

    e.target.value = "";
  };

  const maybeHandleUndoRedo = (e) => {
    if (disableUndoRedo) {
      return false;
    }

    if (((isMac && e.metaKey) || (!isMac && e.ctrlKey)) && e.key === 'z') {
      e.preventDefault();

      if (e.shiftKey && historyIndex < history.length - 1) {
        const nextTags = history[historyIndex + 1];
        setTags(nextTags);
        setHistoryIndex(historyIndex + 1);
      } else if (!e.shiftKey && historyIndex > 0) {
        const prevTags = history[historyIndex - 1];
        setTags(prevTags);
        setHistoryIndex(historyIndex - 1);
      }

      return true;
    }

    return false;
  };

  const handleOnKeyUp = e => {
    e.stopPropagation();

    if (maybeHandleUndoRedo(e)) {
      return;
    }

    const text = e.target.value;

    if (
      !text &&
      !disableBackspaceRemove &&
      tags.length &&
      e.key === "Backspace"
    ) {
      e.target.value = isEditOnRemove ? `${tags.at(-1)} ` : "";
      setTags([...tags.slice(0, -1)]);
    }

    if (text && (separators || defaultSeparators).includes(e.key)) {
      e.preventDefault();
      maybeSetTags(text, e);
    }
  };

  const handleOnBlur = e => {
    const text = e.target.value.trim();

    if (text) {
      maybeSetTags(text, e);
    }

    onBlur && onBlur(e);
  };

  const onTagRemove = text => {
    setTags(tags.filter(tag => tag !== text));
    onRemoved && onRemoved(text);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div aria-labelledby={name} className="rti--container" onClick={handleContainerClick}>
      {tags.map(tag => (
        <Tag
          key={tag}
          className={classNames?.tag}
          text={tag}
          remove={onTagRemove}
          disabled={disabled}
        />
      ))}

      <input
        ref={inputRef}
        className={cc("rti--input", classNames?.input)}
        type="text"
        name={name}
        placeholder={placeHolder}
        onKeyDown={handleOnKeyUp}
        onBlur={handleOnBlur}
        disabled={disabled}
        onKeyUp={onKeyUp}
      />
    </div>
  );
};
