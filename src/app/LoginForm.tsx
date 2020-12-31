import React, { useState } from "react";

import { Form, Input, Button, Checkbox, Modal, Alert, Divider } from "antd";
import { LockOutlined } from "@ant-design/icons";

import { Settings, StorageSession, generateKeyFromStoredSalt } from "./settings";

function LoginForm({
  anyAuthStored,
  onLogin,
}: {
  anyAuthStored: boolean;
  onLogin: (settings: Settings, session: StorageSession) => void;
}) {
  let [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      let key = await generateKeyFromStoredSalt(values["password"]);
      let reset = values["reset"] as boolean;

      let session = new StorageSession(key);
      let settingsLoadResult = await session.loadSettings(reset);

      if (anyAuthStored && settingsLoadResult.status.loadAuthFailed) {
        Modal.error({
          title: "Failure",
          content: "Failed to decrypt local data. Password mismatch?",
        });
      } else {
        // Call to onLogin must be asynchronous, because otherwise setLoading
        // would try to do a state update to an already unmounted component.
        setTimeout(() => {
          onLogin(settingsLoadResult.settings, session);
        }, 0);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={true}
      title={
        <span style={{ fontSize: 20 }}>
          <img src="./favicon.ico" alt="logo" style={{ height: "32px", marginRight: "8px" }} />
          notemarks
        </span>
      }
      closable={false}
      footer={null}
    >
      <Alert
        message="Welcome to notemarks!"
        description={
          <span>
            Notemarks is a git based labeling app to manage notes, documents, and bookmarks. If you
            are new to notemarks visit the{" "}
            <a
              href="https://github.com/notemarks/notemarks"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub project page
            </a>{" "}
            for more information.
          </span>
        }
        type="info"
      />

      <Divider />
      <Form initialValues={{ reset: !anyAuthStored, password: "" }} onFinish={onFinish}>
        <Form.Item
          name="password"
          validateTrigger="onBlur"
          rules={[
            () => ({
              validator(rule, value) {
                if (value != null && value.length >= 4) {
                  return Promise.resolve();
                } else {
                  return Promise.reject(
                    "Local encryption password should have at least 4 characters."
                  );
                }
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            type="password"
            placeholder="Local encryption password"
            autoFocus
          />
        </Form.Item>
        <Form.Item name="reset" valuePropName="checked">
          <Checkbox>Reset local encryption password</Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Start
          </Button>
        </Form.Item>
      </Form>

      <Divider />
      <div style={{ fontSize: 12, marginTop: "8px", color: "#666" }}>
        <p>What is the purpose of the local encryption password?</p>
        To enhance security, notemarks stores data in the browser cache with encryption. The
        password does not refer to any account, i.e., no sign-up is required. You can choose and
        reset the password at will. Losing or resetting the password will only mean that you'll have
        to reconfigure the GitHub authentication setting of the app on this particular client. For
        more information check the{" "}
        <a
          href="https://github.com/notemarks/notemarks#GitHubAuthentication"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub authentication
        </a>{" "}
        section in the readme.
      </div>
    </Modal>
  );
}

export default LoginForm;
