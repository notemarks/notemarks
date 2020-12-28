import React from "react";

import { Select } from "antd";

import { Repo, Repos } from "../repo";

const { Option } = Select;

export type RepoSelectProps = {
  repos: Repos;
  onChange: (repo: Repo) => void;
};

export function RepoSelect({ repos, onChange }: RepoSelectProps) {
  return (
    <Select
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
