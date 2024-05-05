import React from "react";
import { Layout, Row, Col, Typography } from "antd";
import { AiFillGithub, AiOutlineTwitter, AiFillInstagram } from "react-icons/ai";
import { FaLinkedinIn } from "react-icons/fa";

const { Footer } = Layout;
const { Title } = Typography;

function CustomFooter() {
  const year = new Date().getFullYear();
  return (
    <Footer style={{ textAlign: 'center', padding: '20px 0' }}>
      <Row justify="space-between" align="middle">
        <Col span={8}>
          <Title level={5} style={{ margin: 0 }}>
            Designed and Developed by Divyansh Rao
          </Title>
        </Col>
        <Col span={8}>
          <Title level={5} style={{  margin: 0 }}>
            Copyright © {year} DR
          </Title>
        </Col>
        <Col span={8}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a href="https://github.com/divyanshrao38" target="_blank" rel="noopener noreferrer" style={{  marginRight: 12 }}>
              <AiFillGithub size="24px" />
            </a>
            <a href="https://twitter.com/Drikka96s" target="_blank" rel="noopener noreferrer" style={{  marginRight: 12 }}>
              <AiOutlineTwitter size="24px" />
            </a>
            <a href="https://www.linkedin.com/in/divyansh-rao-41729a135/" target="_blank" rel="noopener noreferrer" style={{  marginRight: 12 }}>
              <FaLinkedinIn size="24px" />
            </a>
            <a href="https://www.instagram.com/divyansh_rao/" target="_blank" rel="noopener noreferrer" >
              <AiFillInstagram size="24px" />
            </a>
          </div>
        </Col>
      </Row>
    </Footer>
  );
}

export default CustomFooter;
