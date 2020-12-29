import React from "react";

import { Select } from "antd";

import { Repo, Repos } from "../repo";

const { Option } = Select;

/*
Things wrapped into a Form.Item need to support the props:
- value: T
- onChange: (T) => void

However, these props must not be supplied manually by the user,
this is taken care of in the Form.Item wrapper. Trying to do
so manually via

<RepoSelect
  value={form.getFieldValue("repo")}
  repos={repos}
  onChange={(repo) => form.setFieldsValue({ repo: repo })}
/>

references the `form` before it has been created, which leads
to an runtime error.

This means that
the component doesn't type check properly though. The easiest
work-around is perhaps to make these props optional.

References:
- The "Customized Form Controls" example https://ant.design/components/form/#components-form-demo-customized-form-controls
- https://medium.com/swlh/use-custom-and-third-party-react-form-components-with-ant-design-and-typescript-2732e7849aee
*/

export type RepoSelectProps = {
  repos: Repos;
  value?: Repo;
  onChange?: (repo: Repo) => void;
};

export function RepoSelect({ repos, value, onChange }: RepoSelectProps) {
  return (
    <Select
      value={value?.name}
      onChange={(value) => {
        let repo = repos.find((repo) => repo.name === value);
        if (repo != null && onChange != null) {
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
