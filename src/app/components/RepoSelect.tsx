import React from "react";

import { Select } from "antd";

import { Repo, Repos } from "../repo";

const { Option } = Select;

export type RepoSelectProps = {
  value: Repo | undefined;
  repos: Repos;
  onChange: (repo: Repo) => void;
};

export function RepoSelect({ value, repos, onChange }: RepoSelectProps) {
  return (
    <Select
      value={value?.name}
      onChange={(value) => {
        let repo = repos.find((repo) => repo.name === value);
        if (repo != null) {
          onChange(repo);
        }
      }}
    >
      {repos.map((repo, i) => (
        <Option key={i} value={repo.name}>
          {repo.name}
        </Option>
      ))}
    </Select>
  );
}

export default RepoSelect;
