"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "antd";
import { 
  HomeOutlined, 
  WalletOutlined, 
  CreditCardOutlined, 
  PieChartOutlined, 
  TeamOutlined, 
  SettingOutlined,
  SafetyCertificateOutlined
} from "@ant-design/icons";

export function SidebarMenu({ role }: { role?: string }) {
  const pathname = usePathname();

  const items = [
    { key: "/", icon: <HomeOutlined />, label: <Link href="/">Dashboard</Link> },
    { key: "/transactions", icon: <WalletOutlined />, label: <Link href="/transactions">Transactions</Link> },
    { key: "/credit-cards", icon: <CreditCardOutlined />, label: <Link href="/credit-cards">Credit Cards</Link> },
    { key: "/budgets", icon: <PieChartOutlined />, label: <Link href="/budgets">Budgets</Link> },
    { key: "/people", icon: <TeamOutlined />, label: <Link href="/people">People</Link> },
    { key: "/settings", icon: <SettingOutlined />, label: <Link href="/settings">Settings</Link> },
  ];

  if (role === "ADMIN") {
    items.push({ key: "/admin/dashboard", icon: <SafetyCertificateOutlined />, label: <Link href="/admin/dashboard">Admin Portal</Link> });
  }

  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={items}
      style={{ borderRight: 0, backgroundColor: 'transparent' }}
    />
  );
}
