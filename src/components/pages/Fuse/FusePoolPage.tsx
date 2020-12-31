import { Avatar, Heading, Switch, Text } from "@chakra-ui/react";
import { Column, Row, RowOrColumn } from "buttered-chakra";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useRari } from "../../../context/RariContext";
import { useIsSemiSmallScreen } from "../../../hooks/useIsSemiSmallScreen";
import { smallUsdFormatter } from "../../../utils/bigUtils";
import CopyrightSpacer from "../../shared/CopyrightSpacer";
import DashboardBox, { DASHBOARD_BOX_SPACING } from "../../shared/DashboardBox";
import ForceAuthModal from "../../shared/ForceAuthModal";
import { Header } from "../../shared/Header";
import { ModalDivider } from "../../shared/Modal";
import FuseStatsBar from "./FuseStatsBar";
import FuseTabBar from "./FuseTabBar";

const FusePoolPage = React.memo(() => {
  const { isAuthed } = useRari();

  const isMobile = useIsSemiSmallScreen();

  // let { poolId } = useParams();

  return (
    <>
      <ForceAuthModal />

      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        color="#FFFFFF"
        mx="auto"
        width={isMobile ? "100%" : "1150px"}
        px={isMobile ? DASHBOARD_BOX_SPACING.asPxString() : 0}
      >
        <Header isAuthed={isAuthed} />

        <FuseStatsBar />

        <FuseTabBar />
        <RowOrColumn
          width="100%"
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          isRow={!isMobile}
        >
          <DashboardBox
            width={isMobile ? "100%" : "50%"}
            mt={DASHBOARD_BOX_SPACING.asPxString()}
            height="auto"
          >
            <SupplyList />
          </DashboardBox>

          <DashboardBox
            ml={isMobile ? 0 : 4}
            width={isMobile ? "100%" : "50%"}
            mt={DASHBOARD_BOX_SPACING.asPxString()}
            height="auto"
          >
            <BorrowList />
          </DashboardBox>
        </RowOrColumn>
      </Column>

      <CopyrightSpacer forceShow />
    </>
  );
});

export default FusePoolPage;

const SupplyList = React.memo(() => {
  const { t } = useTranslation();

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      pb={4}
    >
      <Heading size="md" px={4} py={3}>
        Supply Balance: {"$200,000"}
      </Heading>
      <ModalDivider />

      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        width="100%"
        px={4}
        mt={4}
      >
        <Text width="27%" fontWeight="bold" pl={1}>
          {t("Asset")}
        </Text>

        <Text width="27%" fontWeight="bold" textAlign="right">
          {t("APY/Earned")}
        </Text>

        <Text width="27%" fontWeight="bold" textAlign="right">
          {t("Balance")}
        </Text>

        <Text width="20%" fontWeight="bold" textAlign="right">
          {t("Collateral")}
        </Text>
      </Row>

      <AssetSupplyRow
        symbol="RGT"
        icon="https://assets.coingecko.com/coins/images/12900/small/rgt_logo.png?1603340632"
        apy={15.2}
        earned={10.42}
        balance={70000}
        isCollateral
      />

      <AssetSupplyRow
        symbol="SFI"
        icon="https://assets.coingecko.com/coins/images/13117/small/sfi_red_250px.png?1606020144"
        color="#C34535"
        apy={90.2}
        earned={30.2}
        balance={1500}
        isCollateral
      />
      {/* 
      <AssetSupplyRow
        symbol="MLN"
        icon="https://assets.coingecko.com/coins/images/605/small/melon.png?1547034295"
        apy={15.2}
        earned={5.25}
        balance={10000}
        isCollateral
      /> */}
    </Column>
  );
});

const AssetSupplyRow = React.memo(
  ({
    symbol,
    icon,
    apy,
    earned,
    balance,
    isCollateral,
    color,
  }: {
    symbol: string;
    icon: string;
    apy: number;
    earned: number;
    balance: number;
    isCollateral: boolean;
    color?: string;
  }) => {
    return (
      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        width="100%"
        px={4}
        mt={2}
      >
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          width="27%"
        >
          <Avatar bg="#FFF" boxSize="37px" name="RGT" src={icon} />
          <Text fontWeight="bold" fontSize="lg" ml={2}>
            {symbol}
          </Text>
        </Row>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text color={color ?? "#949494"} fontWeight="bold" fontSize="17px">
            {apy}%
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(earned).replace("$", "")} {symbol}
          </Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text color={color ?? "#949494"} fontWeight="bold" fontSize="17px">
            {smallUsdFormatter(balance * Math.random() * 10)}
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(balance).replace("$", "")} {symbol}
          </Text>
        </Column>

        <Row
          width="20%"
          mainAxisAlignment="flex-end"
          crossAxisAlignment="center"
        >
          <Switch
            isChecked={isCollateral}
            colorScheme="teal"
            size="md"
            mt={1}
            mr={5}
          />
        </Row>
      </Row>
    );
  }
);

const BorrowList = React.memo(() => {
  const { t } = useTranslation();

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      pb={4}
    >
      <Heading size="md" px={4} py={3}>
        {t("Borrow Balance:")} {"$10,000"}
      </Heading>
      <ModalDivider />

      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="flex-start"
        width="100%"
        px={4}
        mt={4}
      >
        <Text width="27%" fontWeight="bold" pl={1}>
          {t("Asset")}
        </Text>

        <Text width="27%" fontWeight="bold" textAlign="right">
          {t("APY/Accrued")}
        </Text>

        <Text width="27%" fontWeight="bold" textAlign="right">
          {t("Borrowed")}
        </Text>

        <Text width="20%" fontWeight="bold" textAlign="right">
          {t("Liquidity")}
        </Text>
      </Row>

      <AssetBorrowRow
        symbol="RGT"
        icon="https://assets.coingecko.com/coins/images/12900/small/rgt_logo.png?1603340632"
        apy={15.2}
        earned={10.42}
        balance={70000}
      />

      <AssetBorrowRow
        symbol="SFI"
        icon="https://assets.coingecko.com/coins/images/13117/small/sfi_red_250px.png?1606020144"
        color="#C34535"
        apy={90.2}
        earned={30.2}
        balance={1500}
      />
      {/* 
      <AssetSupplyRow
        symbol="MLN"
        icon="https://assets.coingecko.com/coins/images/605/small/melon.png?1547034295"
        apy={15.2}
        earned={5.25}
        balance={10000}
        isCollateral
      /> */}
    </Column>
  );
});

const AssetBorrowRow = React.memo(
  ({
    symbol,
    icon,
    apy,
    earned,
    balance,

    color,
  }: {
    symbol: string;
    icon: string;
    apy: number;
    earned: number;
    balance: number;

    color?: string;
  }) => {
    return (
      <Row
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        width="100%"
        px={4}
        mt={2}
      >
        <Row
          mainAxisAlignment="flex-start"
          crossAxisAlignment="center"
          width="27%"
        >
          <Avatar bg="#FFF" boxSize="37px" name="RGT" src={icon} />
          <Text fontWeight="bold" fontSize="lg" ml={2}>
            {symbol}
          </Text>
        </Row>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text color={color ?? "#949494"} fontWeight="bold" fontSize="17px">
            {apy}%
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(earned).replace("$", "")} {symbol}
          </Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="27%"
        >
          <Text color={color ?? "#949494"} fontWeight="bold" fontSize="17px">
            {smallUsdFormatter(balance * Math.random() * 10)}
          </Text>

          <Text fontSize="sm">
            {smallUsdFormatter(balance).replace("$", "")} {symbol}
          </Text>
        </Column>

        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-end"
          width="20%"
        >
          <Text color={color ?? "#949494"} fontWeight="bold" fontSize="17px">
            $1.25M
          </Text>

          <Text fontSize="sm">3.5M {symbol}</Text>
        </Column>
      </Row>
    );
  }
);
