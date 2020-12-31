import React, { useState } from "react";

import { Form, Input, Button, Checkbox, Modal, Alert, Divider } from "antd";
import { LockOutlined } from "@ant-design/icons";

function LoginForm() {
  /*
  state = {
    loading: false,
    visible: true,
  };

  showModal = () => {
    this.setState({
      visible: true,
    });
  };

  handleOk = () => {
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ loading: false, visible: false });
    }, 3000);
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };
  */

  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
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
      //onOk={this.handleOk}
      //onCancel={this.handleCancel}
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
      <Form initialValues={{ reset: false }} onFinish={onFinish}>
        <Form.Item
          name="password"
          validateTrigger="onFinish"
          rules={[
            () => ({
              validator(rule, value) {
                if (value.length >= 4) {
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

            //onPressEnter={onStart}
          />
        </Form.Item>
        <Form.Item name="reset" valuePropName="checked">
          <Checkbox>Reset local encryption password</Checkbox>
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button type="primary">Start</Button>
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
