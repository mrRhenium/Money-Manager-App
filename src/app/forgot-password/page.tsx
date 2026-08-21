"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Input, Button, Form, Typography, Alert } from "antd";
import { MailOutlined, LockOutlined, KeyOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { sendResetOtp, resetPassword } from "@/actions/auth";

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [form] = Form.useForm();

  const handleSendOtp = async (values: { email: string }) => {
    setError("");
    setLoading(true);

    try {
      await sendResetOtp(values.email);
      setEmail(values.email);
      setSuccess("If an account exists, an OTP has been sent (Check server console for DEV).");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (values: any) => {
    setError("");
    setSuccess("");
    setLoading(true);

    const { otp, newPassword, confirmPassword } = values;

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, otp, newPassword);
      setSuccess("Password has been reset successfully! Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8 relative">
      <Link href="/login" style={{ position: 'absolute', top: 32, left: 32, display: 'flex', alignItems: 'center', fontWeight: 500, color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}>
        <ArrowLeftOutlined style={{ marginRight: 8 }} /> Back to Login
      </Link>
      
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 shadow-lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', boxShadow: '0 10px 15px -3px hsla(var(--primary), 0.2)' }}>
          <KeyOutlined style={{ fontSize: '32px' }} />
        </div>
        <Title level={2} style={{ margin: 0 }}>Reset Password</Title>
        <Text type="secondary">
          {step === 1 ? "Enter your email to receive a recovery code" : "Enter your recovery code and new password"}
        </Text>
      </div>

      <Card 
        className="w-full max-w-[420px] rounded-2xl shadow-xl"
        bordered={false}
      >
        {step === 1 ? (
          <Form
            name="send_otp_form"
            layout="vertical"
            onFinish={handleSendOtp}
            size="large"
            requiredMark={false}
          >
            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}

            <Form.Item
              label="Email address"
              name="email"
              rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
            >
              <Input prefix={<MailOutlined className="site-form-item-icon text-gray-400" />} placeholder="Enter email address" />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
                Send OTP
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            form={form}
            name="reset_password_form"
            layout="vertical"
            onFinish={handleResetPassword}
            size="large"
            requiredMark={false}
          >
            {error && (
              <Form.Item>
                <Alert message={error} type="error" showIcon />
              </Form.Item>
            )}
            {success && (
              <Form.Item>
                <Alert message={success} type="success" showIcon />
              </Form.Item>
            )}

            <Form.Item
              label="Type your 6 digits OTP"
              name="otp"
              rules={[{ required: true, message: 'Please enter the 6-digit OTP!' }]}
            >
              <Input.OTP length={6} size="large" />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[{ required: true, message: 'Please enter your new password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                placeholder="••••••••"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" style={{ width: '100%', fontWeight: 600, height: 44 }} loading={loading}>
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
}
