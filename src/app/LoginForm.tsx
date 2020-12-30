import React, { useState } from "react";

import { Form, Input, Button, Checkbox, Modal, Alert, Divider, Grid, Row } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

/*
#components-form-demo-normal-login .login-form {
  max-width: 300px;
}
#components-form-demo-normal-login .login-form-forgot {
  float: right;
}
#components-form-demo-normal-login .ant-col-rtl .login-form-forgot {
  float: left;
}
#components-form-demo-normal-login .login-form-button {
  width: 100%;
}
*/

/*
const LoginForm = () => {
  const onFinish = (values: any) => {
    console.log("Received values of form: ", values);
  };

  return (
    <Form
      name="normal_login"
      className="login-form"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      style={{ maxWidth: 300, margin: "auto auto" }}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: "Please input your Username!" }]}
      >
        <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Username" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: "Please input your Password!" }]}
      >
        <Input
          prefix={<LockOutlined className="site-form-item-icon" />}
          type="password"
          placeholder="Password"
        />
      </Form.Item>
      <Form.Item>
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>Remember me</Checkbox>
        </Form.Item>

        <a className="login-form-forgot" href="">
          Forgot password
        </a>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          Log in
        </Button>
        Or <a href="">register now!</a>
      </Form.Item>
    </Form>
  );
};
*/

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

  const onStart = () => {
    console.log("start");
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
            <a href="https://github.com/notemarks/notemarks">GitHub project page</a> for more
            information.
          </span>
        }
        type="info"
      />
      <Divider />
      <Form.Item>
        <Input.Password
          prefix={<LockOutlined />}
          type="password"
          placeholder="Local encryption password"
          autoFocus
          onPressEnter={onStart}
        />
      </Form.Item>
      <Form.Item>
        <Checkbox>Reset local encryption password</Checkbox>
      </Form.Item>
      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary">Start</Button>
      </Form.Item>
      <Divider />
      <div style={{ fontSize: 12, marginTop: "8px", color: "#666" }}>
        <p>What is the purpose of the local encryption password?</p>
        To achieve high security, notemarks stores data in the browser cache with encryption. The
        password does not refer to any account, i.e., no sign-up is required. You can choose and
        reset the password at will. Losing or resetting the password will only mean that you'll have
        to reconfigure the settings of the app on this particular client.
      </div>
    </Modal>
  );
}

export default LoginForm;
