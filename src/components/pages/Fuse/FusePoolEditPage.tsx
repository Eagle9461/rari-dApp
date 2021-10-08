// Chakra and UI
import {
  AvatarGroup,
  Box,
  Badge,
  Heading,
  Text,
  Switch,
  useDisclosure,
  Spinner,
  useToast,
  Input,
  Link,
  // Table
  Table,
  Thead,
  Tbody,
  Image,
  HStack,
  Table,
  TableCaption,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { Column, RowOrColumn, Center, Row } from "utils/chakraUtils";
import DashboardBox, { DASHBOARD_BOX_PROPS } from "../../shared/DashboardBox";
import { ModalDivider } from "../../shared/Modal";
import { SliderWithLabel } from "../../shared/SliderWithLabel";

// Components
import { Header } from "../../shared/Header";
import FuseStatsBar from "./FuseStatsBar";
import FuseTabBar from "./FuseTabBar";
import AddAssetModal from "./Modals/AddAssetModal/AddAssetModal";
import AssetSettings from "./Modals/AddAssetModal/AssetSettings";
import { WhitelistInfo } from "./FusePoolCreatePage";
import { useExtraPoolInfo } from "./FusePoolInfoPage";

// React
import { memo, ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useQueryClient, useQuery } from "react-query";

// Rari
import { useRari } from "../../../context/RariContext";

// Hooks
import { useIsSemiSmallScreen } from "../../../hooks/useIsSemiSmallScreen";
import { useFusePoolData } from "../../../hooks/useFusePoolData";
import {
  TokenData,
  useTokenData,
  useTokensData,
} from "../../../hooks/useTokenData";
import {
  OracleDataType,
  useIdentifyOracle,
  useOracleData,
} from "hooks/fuse/useOracleData";

// Utils
import { USDPricedFuseAsset } from "../../../utils/fetchFusePoolData";
import { CTokenAvatarGroup, CTokenIcon } from "components/shared/CTokenIcon";
import {
  createComptroller,
  createUnitroller,
} from "../../../utils/createComptroller";
import { handleGenericError } from "utils/errorHandling";

// Libraries
import BigNumber from "bignumber.js";
import LogRocket from "logrocket";
import { useIsComptrollerAdmin } from "./FusePoolPage";
import { AdminAlert } from "components/shared/AdminAlert";
import useOraclesForPool from "hooks/fuse/useOraclesForPool";
import { shortAddress } from "utils/shortAddress";

import { useAuthedCallback } from "hooks/useAuthedCallback";
import {
  useCTokensUnderlying,
  usePoolIncentives,
} from "hooks/rewards/usePoolIncentives";
import { useRewardsDistributorsForPool } from "hooks/rewards/useRewardsDistributorsForPool";
import { RewardsDistributor } from "hooks/rewards/useRewardsDistributorsForPool";
import { useTokenBalance } from "hooks/useTokenBalance";
import AddRewardsDistributorModal from "./Modals/AddRewardsDistributorModal";
import EditRewardsDistributorModal from "./Modals/EditRewardsDistributorModal";

const activeStyle = { bg: "#FFF", color: "#000" };
const noop = () => {};

const formatPercentage = (value: number) => value.toFixed(0) + "%";

export enum ComptrollerErrorCodes {
  NO_ERROR,
  UNAUTHORIZED,
  COMPTROLLER_MISMATCH,
  INSUFFICIENT_SHORTFALL,
  INSUFFICIENT_LIQUIDITY,
  INVALID_CLOSE_FACTOR,
  INVALID_COLLATERAL_FACTOR,
  INVALID_LIQUIDATION_INCENTIVE,
  MARKET_NOT_ENTERED, // no longer possible
  MARKET_NOT_LISTED,
  MARKET_ALREADY_LISTED,
  MATH_ERROR,
  NONZERO_BORROW_BALANCE,
  PRICE_ERROR,
  REJECTION,
  SNAPSHOT_ERROR,
  TOO_MANY_ASSETS,
  TOO_MUCH_REPAY,
  SUPPLIER_NOT_WHITELISTED,
  BORROW_BELOW_MIN,
  SUPPLY_ABOVE_MAX,
  NONZERO_TOTAL_SUPPLY,
}

export const useIsUpgradeable = (comptrollerAddress: string) => {
  const { fuse } = useRari();

  const { data } = useQuery(comptrollerAddress + " isUpgradeable", async () => {
    const comptroller = createComptroller(comptrollerAddress, fuse);

    const isUpgradeable: boolean = await comptroller.methods
      .adminHasRights()
      .call();

    return isUpgradeable;
  });

  return data;
};

export async function testForComptrollerErrorAndSend(
  txObject: any,
  caller: string,
  failMessage: string
) {
  let response = await txObject.call({ from: caller });

  // For some reason `response` will be `["0"]` if no error but otherwise it will return a string number.
  if (response[0] !== "0") {
    const err = new Error(
      failMessage + " Code: " + (ComptrollerErrorCodes[response] ?? response)
    );

    LogRocket.captureException(err);
    throw err;
  }

  return txObject.send({ from: caller });
}

const FusePoolEditPage = memo(() => {
  const { isAuthed } = useRari();

  const isMobile = useIsSemiSmallScreen();

  const {
    isOpen: isAddAssetModalOpen,
    onOpen: openAddAssetModal,
    onClose: closeAddAssetModal,
  } = useDisclosure();

  const {
    isOpen: isAddRewardsDistributorModalOpen,
    onOpen: openAddRewardsDistributorModal,
    onClose: closeAddRewardsDistributorModal,
  } = useDisclosure();

  const {
    isOpen: isEditRewardsDistributorModalOpen,
    onOpen: openEditRewardsDistributorModal,
    onClose: closeEditRewardsDistributorModal,
  } = useDisclosure();

  const authedOpenModal = useAuthedCallback(openAddAssetModal);

  const { t } = useTranslation();

  const { poolId } = useParams();

  const data = useFusePoolData(poolId);
  const isAdmin = useIsComptrollerAdmin(data?.comptroller);

  // RewardsDistributor stuff
  const poolIncentives = usePoolIncentives(data?.comptroller);
  const rewardsDistributors = useRewardsDistributorsForPool(data?.comptroller);
  const [rewardsDistributor, setRewardsDistributor] = useState<
    RewardsDistributor | undefined
  >();


  console.log({ rewardsDistributors, poolIncentives });

  const handleRewardsRowClick = useCallback(
    (rD: RewardsDistributor) => {
      setRewardsDistributor(rD);
      openEditRewardsDistributorModal();
    },
    [setRewardsDistributor, openEditRewardsDistributorModal]
  );

  return (
    <>
      {data ? (
        <AddAssetModal
          comptrollerAddress={data.comptroller}
          poolOracleAddress={data.oracle}
          oracleModel={data.oracleModel}
          existingAssets={data.assets}
          poolName={data.name}
          poolID={poolId}
          isOpen={isAddAssetModalOpen}
          onClose={closeAddAssetModal}
        />
      ) : null}

      {data ? (
        <AddRewardsDistributorModal
          comptrollerAddress={data.comptroller}
          poolName={data.name}
          poolID={poolId}
          isOpen={isAddRewardsDistributorModalOpen}
          onClose={closeAddRewardsDistributorModal}
        />
      ) : null}

      {data && !!rewardsDistributor ? (
        <EditRewardsDistributorModal
          rewardsDistributor={rewardsDistributor}
          pool={data}
          isOpen={isEditRewardsDistributorModalOpen}
          onClose={closeEditRewardsDistributorModal}
        />
      ) : null}

      <Column
        mainAxisAlignment="flex-start"
        crossAxisAlignment="center"
        color="#FFFFFF"
        mx="auto"
        width={isMobile ? "100%" : "1150px"}
        px={isMobile ? 4 : 0}
      >
        {/* <Header isAuthed={isAuthed} isFuse />

        <FuseStatsBar data={data} /> */}

        <FuseTabBar />

        {!!data && (
          <AdminAlert
            isAdmin={isAdmin}
            isAdminText="You are the admin of this Fuse Pool!"
            isNotAdminText="You are not the admin of this Fuse Pool!"
          />
        )}

        <RowOrColumn
          width="100%"
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          isRow={!isMobile}
        >
          <DashboardBox
            width={isMobile ? "100%" : "50%"}
            height={isMobile ? "auto" : "560px"}
            mt={4}
          >
            {data ? (
              <PoolConfiguration
                assets={data.assets}
                comptrollerAddress={data.comptroller}
                oracleAddress={data.oracle}
              />
            ) : (
              <Center expand>
                <Spinner my={8} />
              </Center>
            )}
          </DashboardBox>

          <Box pl={isMobile ? 0 : 4} width={isMobile ? "100%" : "50%"}>
            <DashboardBox
              width="100%"
              mt={4}
              height={isMobile ? "auto" : "560px"}
            >
              {data ? (
                data.assets.length > 0 ? (
                  <AssetConfiguration
                    openAddAssetModal={authedOpenModal}
                    assets={data.assets}
                    poolOracleAddress={data.oracle}
                    oracleModel={data.oracleModel}
                    comptrollerAddress={data.comptroller}
                    poolID={poolId}
                    poolName={data.name}
                  />
                ) : (
                  <Column
                    expand
                    mainAxisAlignment="center"
                    crossAxisAlignment="center"
                    py={4}
                  >
                    <Text mb={4}>{t("There are no assets in this pool.")}</Text>

                    <AddAssetButton
                      comptrollerAddress={data.comptroller}
                      openAddAssetModal={authedOpenModal}
                    />
                  </Column>
                )
              ) : (
                <Center expand>
                  <Spinner my={8} />
                </Center>
              )}
            </DashboardBox>
          </Box>
        </RowOrColumn>

        {/* Rewards Distributors */}
        <DashboardBox w="100%" h="100%" my={4}>
          <Row mainAxisAlignment="flex-end" crossAxisAlignment="center" p={3}>
            <AddRewardsDistributorButton
              openAddRewardsDistributorModal={openAddRewardsDistributorModal}
              comptrollerAddress={data?.comptroller}
            />
          </Row>

          <Table>
            <Thead>
              <Tr>
                <Th color="white" size="sm">
                  {t("Reward Token:")}
                </Th>
                <Th color="white">{t("Active CTokens:")}</Th>
                <Th color="white">{t("Balance:")}</Th>
                <Th color="white">{t("Admin?")}</Th>
              </Tr>
            </Thead>

            <Tbody minHeight="50px">
              {!data ? (
                <Spinner />
              ) : rewardsDistributors.length ? (
                rewardsDistributors.map((rD, i) => {
                  return (
                    <RewardsDistributorRow
                      key={rD.address}
                      rewardsDistributor={rD}
                      handleRowClick={handleRewardsRowClick}
                      hideModalDivider={i === rewardsDistributors.length - 1}
                      activeCTokens={
                        poolIncentives.rewardsDistributorCtokens[rD.address]
                      }
                    />
                  );
                })
              ) : (
                <>
                  <Text mb={4}>
                    {t("There are no RewardsDistributors for this pool.")}
                  </Text>
                  <AddRewardsDistributorButton
                    openAddRewardsDistributorModal={
                      openAddRewardsDistributorModal
                    }
                    comptrollerAddress={data?.comptroller}
                  />
                </>
              )}
            </Tbody>
          </Table>

          <ModalDivider />
        </DashboardBox>
      </Column>
    </>
  );
});

export default FusePoolEditPage;

const PoolConfiguration = ({
  assets,
  comptrollerAddress,
  oracleAddress,
}: {
  assets: USDPricedFuseAsset[];
  comptrollerAddress: string;
  oracleAddress: string;
}) => {
  const { t } = useTranslation();
  const { poolId } = useParams();

  const { fuse, address } = useRari();

  const queryClient = useQueryClient();
  const toast = useToast();

  const data = useExtraPoolInfo(comptrollerAddress, oracleAddress);

  // Maps underlying to oracle
  const oraclesMap = useOraclesForPool(
    oracleAddress,
    assets.map((asset: USDPricedFuseAsset) => asset.underlyingToken) ?? []
  );

  const changeWhitelistStatus = async (enforce: boolean) => {
    const comptroller = createComptroller(comptrollerAddress, fuse);

    try {
      await testForComptrollerErrorAndSend(
        comptroller.methods._setWhitelistEnforcement(enforce),
        address,
        ""
      );

      LogRocket.track("Fuse-ChangeWhitelistStatus");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const addToWhitelist = async (newUser: string) => {
    const comptroller = createComptroller(comptrollerAddress, fuse);

    const newList = [...data!.whitelist, newUser];

    try {
      await testForComptrollerErrorAndSend(
        comptroller.methods._setWhitelistStatuses(
          newList,
          Array(newList.length).fill(true)
        ),
        address,
        ""
      );

      LogRocket.track("Fuse-AddToWhitelist");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const removeFromWhitelist = async (removeUser: string) => {
    const comptroller = createComptroller(comptrollerAddress, fuse);

    const whitelist = data!.whitelist;
    try {
      await testForComptrollerErrorAndSend(
        comptroller.methods._setWhitelistStatuses(
          whitelist,
          whitelist.map((user: string) => user !== removeUser)
        ),
        address,
        ""
      );

      LogRocket.track("Fuse-RemoveFromWhitelist");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const [admin, setAdmin] = useState(address);

  const revokeRights = async () => {
    const unitroller = createUnitroller(comptrollerAddress, fuse);

    try {
      await testForComptrollerErrorAndSend(
        unitroller.methods._renounceAdminRights(),
        address,
        ""
      );

      LogRocket.track("Fuse-RevokeRights");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const acceptAdmin = async () => {
    const unitroller = createUnitroller(comptrollerAddress, fuse);

    try {
      await testForComptrollerErrorAndSend(
        unitroller.methods._acceptAdmin(),
        address,
        ""
      );

      LogRocket.track("Fuse-AcceptAdmin");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const updateAdmin = async () => {
    const unitroller = createUnitroller(comptrollerAddress, fuse);

    if (!fuse.web3.utils.isAddress(admin)) {
      handleGenericError({ message: "This is not a valid address." }, toast);
      return;
    }

    try {
      await testForComptrollerErrorAndSend(
        unitroller.methods._setPendingAdmin(admin),
        address,
        ""
      );

      LogRocket.track("Fuse-UpdateAdmin");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const [closeFactor, setCloseFactor] = useState(50);
  const [liquidationIncentive, setLiquidationIncentive] = useState(8);

  const scaleCloseFactor = (_closeFactor: number) => {
    return _closeFactor / 1e16;
  };

  const scaleLiquidationIncentive = (_liquidationIncentive: number) => {
    return _liquidationIncentive / 1e16 - 100;
  };

  // Update values on refetch!
  useEffect(() => {
    if (data) {
      setCloseFactor(scaleCloseFactor(data.closeFactor));
      setLiquidationIncentive(
        scaleLiquidationIncentive(data.liquidationIncentive)
      );
      setAdmin(data.admin);
    }
  }, [data]);

  const updateCloseFactor = async () => {
    // 50% -> 0.5 * 1e18
    const bigCloseFactor = new BigNumber(closeFactor)
      .dividedBy(100)
      .multipliedBy(1e18)
      .toFixed(0);

    const comptroller = createComptroller(comptrollerAddress, fuse);

    try {
      await testForComptrollerErrorAndSend(
        comptroller.methods._setCloseFactor(bigCloseFactor),
        address,
        ""
      );

      LogRocket.track("Fuse-UpdateCloseFactor");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  const updateLiquidationIncentive = async () => {
    // 8% -> 1.08 * 1e8
    const bigLiquidationIncentive = new BigNumber(liquidationIncentive)
      .dividedBy(100)
      .plus(1)
      .multipliedBy(1e18)
      .toFixed(0);

    const comptroller = createComptroller(comptrollerAddress, fuse);

    try {
      await testForComptrollerErrorAndSend(
        comptroller.methods._setLiquidationIncentive(bigLiquidationIncentive),
        address,
        ""
      );

      LogRocket.track("Fuse-UpdateLiquidationIncentive");

      queryClient.refetchQueries();
    } catch (e) {
      handleGenericError(e, toast);
    }
  };

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      height="100%"
    >
      <Heading size="sm" px={4} py={4}>
        {t("Pool {{num}} Configuration", { num: poolId })}
      </Heading>

      <ModalDivider />

      {data ? (
        <Column
          mainAxisAlignment="flex-start"
          crossAxisAlignment="flex-start"
          height="100%"
          width="100%"
          overflowY="auto"
        >
          <ConfigRow>
            <Text fontWeight="bold" mr={2}>
              {t("Assets:")}
            </Text>

            {assets.length > 0 ? (
              <>
                <CTokenAvatarGroup
                  tokenAddresses={assets.map(
                    ({ underlyingToken }) => underlyingToken
                  )}
                  popOnHover={true}
                />

                <Text ml={2} flexShrink={0}>
                  {assets.map(({ underlyingSymbol }, index, array) => {
                    return (
                      underlyingSymbol +
                      (index !== array.length - 1 ? " / " : "")
                    );
                  })}
                </Text>
              </>
            ) : (
              <Text>{t("None")}</Text>
            )}
          </ConfigRow>

          <ModalDivider />

          <Column
            mainAxisAlignment="flex-start"
            crossAxisAlignment="flex-start"
            width="100%"
          >
            <ConfigRow>
              <Text fontWeight="bold">{t("Whitelist")}:</Text>

              <Switch
                ml="auto"
                h="20px"
                isDisabled={!data.upgradeable}
                isChecked={data.enforceWhitelist}
                onChange={() => {
                  changeWhitelistStatus(!data.enforceWhitelist);
                }}
                className="black-switch"
                colorScheme="#121212"
              />
            </ConfigRow>

            {data.enforceWhitelist ? (
              <WhitelistInfo
                whitelist={data.whitelist}
                addToWhitelist={addToWhitelist}
                removeFromWhitelist={removeFromWhitelist}
              />
            ) : null}

            <ModalDivider />

            <ConfigRow height="35px">
              <Text fontWeight="bold">{t("Admin")}:</Text>

              {admin.toLowerCase() !== data.admin.toLowerCase() ? (
                <SaveButton ml={3} onClick={updateAdmin} />
              ) : address.toLowerCase() === data.pendingAdmin.toLowerCase() ? (
                <SaveButton
                  ml={3}
                  onClick={acceptAdmin}
                  fontSize="xs"
                  altText={t("Become Admin")}
                />
              ) : data.adminHasRights &&
                address.toLowerCase() === data.admin.toLowerCase() ? (
                <SaveButton
                  ml={3}
                  onClick={revokeRights}
                  fontSize="xs"
                  altText={t("Revoke Rights")}
                />
              ) : null}

              <Input
                isDisabled={
                  !data.adminHasRights ||
                  data.admin?.toLowerCase() !== address.toLowerCase()
                }
                ml="auto"
                width="320px"
                height="100%"
                textAlign="center"
                variant="filled"
                size="sm"
                value={admin}
                onChange={(event) => {
                  const address = event.target.value;
                  setAdmin(address);
                }}
                {...DASHBOARD_BOX_PROPS}
                _placeholder={{ color: "#e0e0e0" }}
                _focus={{ bg: "#121212" }}
                _hover={{ bg: "#282727" }}
                bg="#282727"
              />
            </ConfigRow>

            <ModalDivider />

            <ConfigRow height="35px">
              <Text fontWeight="bold">{t("Close Factor")}:</Text>

              {data && scaleCloseFactor(data.closeFactor) !== closeFactor ? (
                <SaveButton onClick={updateCloseFactor} />
              ) : null}

              <SliderWithLabel
                ml="auto"
                value={closeFactor}
                setValue={setCloseFactor}
                formatValue={formatPercentage}
                min={5}
                max={90}
              />
            </ConfigRow>

            <ModalDivider />

            <ConfigRow height="35px">
              <Text fontWeight="bold">{t("Liquidation Incentive")}:</Text>

              {data &&
              scaleLiquidationIncentive(data.liquidationIncentive) !==
                liquidationIncentive ? (
                <SaveButton onClick={updateLiquidationIncentive} />
              ) : null}

              <SliderWithLabel
                ml="auto"
                value={liquidationIncentive}
                setValue={setLiquidationIncentive}
                formatValue={formatPercentage}
                min={0}
                max={50}
              />
            </ConfigRow>
            <ModalDivider />

            {/* OraclesTable */}
            <OraclesTable oraclesMap={oraclesMap} data={data} />
            {/* <Column
              mainAxisAlignment="flex-start"
              crossAxisAlignment="flex-start"
              expand
            >
              <ConfigRow height="35px">
                <Text fontWeight="bold">{t("Oracles")}:</Text>
              </ConfigRow>

              {!!data.defaultOracle && (
                <OracleRow
                  oracle={data.defaultOracle}
                  underlyings={[]}
                  isDefault={true}
                />
              )}
              {Object.keys(oraclesMap).map((oracle) => {
                const underlyings = oraclesMap[oracle];
                return <OracleRow oracle={oracle} underlyings={underlyings} />;
              })}
            </Column> */}
          </Column>
        </Column>
      ) : (
        <Center expand>
          <Spinner my={8} />
        </Center>
      )}
    </Column>
  );
};

const OraclesTable = ({
  data,
  oraclesMap,
}: {
  data: any;
  oraclesMap: {
    [oracleAddr: string]: string[];
  };
}) => {
  return (
    <Table variant="unstyled">
      <Thead>
        <Tr>
          <Th color="white">Oracle:</Th>
          <Th color="white">Assets</Th>
        </Tr>
      </Thead>
      <Tbody>
        {!!data.defaultOracle && (
          <OracleRow
            oracle={data.defaultOracle}
            underlyings={[]}
            isDefault={true}
          />
        )}
        {Object.keys(oraclesMap).map((oracle) => {
          const underlyings = oraclesMap[oracle];
          return <OracleRow oracle={oracle} underlyings={underlyings} />;
        })}
      </Tbody>
    </Table>
  );
};

const OracleRow = ({
  oracle,
  underlyings,
  isDefault = false,
}: {
  oracle: string;
  underlyings: string[];
  isDefault?: boolean;
}) => {
  const oracleIdentity = useIdentifyOracle(oracle);

  const displayedOracle = !!oracleIdentity
    ? oracleIdentity
    : shortAddress(oracle);

  return (
    <>
      <Tr>
        <Td>
          <Link
            href={`https://etherscan.io/address/${oracle}`}
            isExternal
            _hover={{ pointer: "cursor", color: "#21C35E" }}
          >
            <Text fontWeight="bold">{displayedOracle}</Text>
          </Link>
        </Td>
        <Td>
          {isDefault ? (
            <span style={{ fontWeight: "bold" }}>DEFAULT</span>
          ) : (
            <AvatarGroup size="xs" max={30} mr={2}>
              {underlyings.map((underlying) => {
                return <CTokenIcon key={underlying} address={underlying} />;
              })}
            </AvatarGroup>
          )}
        </Td>
      </Tr>
    </>
  );
};

const AssetConfiguration = ({
  openAddAssetModal,
  assets,
  comptrollerAddress,
  poolOracleAddress,
  oracleModel,
  poolName,
  poolID,
}: {
  openAddAssetModal: () => any;
  assets: USDPricedFuseAsset[];
  comptrollerAddress: string;
  poolOracleAddress: string;
  oracleModel: string | undefined;
  poolName: string;
  poolID: string;
}) => {
  const { t } = useTranslation();
  const { fuse } = useRari();
  const oracleData = useOracleData(poolOracleAddress, fuse, oracleModel);
  const [selectedAsset, setSelectedAsset] = useState(assets[0]);

  return (
    <Column
      mainAxisAlignment="flex-start"
      crossAxisAlignment="flex-start"
      height="100%"
      width="100%"
      flexShrink={0}
    >
      <ConfigRow mainAxisAlignment="space-between">
        <Heading size="sm">{t("Assets Configuration")}</Heading>

        <AddAssetButton
          comptrollerAddress={comptrollerAddress}
          openAddAssetModal={openAddAssetModal}
        />
      </ConfigRow>

      <ModalDivider />

      <ConfigRow>
        <Text fontWeight="bold" mr={2}>
          {t("Assets:")}
        </Text>

        {assets.map((asset, index, array) => {
          return (
            <Box
              pr={index === array.length - 1 ? 4 : 2}
              key={asset.cToken}
              flexShrink={0}
            >
              <DashboardBox
                as="button"
                onClick={() => setSelectedAsset(asset)}
                {...(asset.cToken === selectedAsset.cToken
                  ? activeStyle
                  : noop)}
              >
                <Center expand px={4} py={1} fontWeight="bold">
                  {asset.underlyingSymbol}
                </Center>
              </DashboardBox>
            </Box>
          );
        })}
      </ConfigRow>

      <ModalDivider />

      <ColoredAssetSettings
        comptrollerAddress={comptrollerAddress}
        tokenAddress={selectedAsset.underlyingToken}
        cTokenAddress={selectedAsset.cToken}
        poolName={poolName}
        poolID={poolID}
        poolOracleAddress={poolOracleAddress}
        oracleModel={oracleModel}
        oracleData={oracleData}
      />
    </Column>
  );
};

const ColoredAssetSettings = ({
  tokenAddress,
  poolName,
  poolID,
  comptrollerAddress,
  cTokenAddress,
  poolOracleAddress,
  oracleModel,
  oracleData,
}: {
  tokenAddress: string;
  poolName: string;
  poolID: string;
  comptrollerAddress: string;
  cTokenAddress: string;
  poolOracleAddress: string;
  oracleModel: string | undefined;
  oracleData?: OracleDataType | string | undefined;
}) => {
  const tokenData = useTokenData(tokenAddress);

  return tokenData ? (
    <AssetSettings
      mode="Editing"
      tokenAddress={tokenAddress}
      poolOracleAddress={poolOracleAddress}
      oracleModel={oracleModel}
      oracleData={oracleData}
      closeModal={noop}
      comptrollerAddress={comptrollerAddress}
      poolName={poolName}
      poolID={poolID}
      tokenData={tokenData}
      cTokenAddress={cTokenAddress}
    />
  ) : (
    <Center expand>
      <Spinner my={8} />
    </Center>
  );
};

export const SaveButton = ({
  onClick,
  altText,
  ...others
}: {
  onClick: () => any;
  altText?: string;
  [key: string]: any;
}) => {
  const { t } = useTranslation();

  return (
    <DashboardBox
      flexShrink={0}
      ml={2}
      px={2}
      height="35px"
      as="button"
      fontWeight="bold"
      onClick={onClick}
      {...others}
    >
      <Center expand>{altText ?? t("Save")}</Center>
    </DashboardBox>
  );
};

const AddAssetButton = ({
  openAddAssetModal,
  comptrollerAddress,
}: {
  openAddAssetModal: () => any;
  comptrollerAddress: string;
}) => {
  const { t } = useTranslation();

  const isUpgradeable = useIsUpgradeable(comptrollerAddress);

  return isUpgradeable ? (
    <DashboardBox
      onClick={openAddAssetModal}
      as="button"
      py={1}
      px={2}
      fontWeight="bold"
    >
      {t("Add Asset")}
    </DashboardBox>
  ) : null;
};

export const ConfigRow = ({
  children,
  ...others
}: {
  children: ReactNode;
  [key: string]: any;
}) => {
  return (
    <Row
      mainAxisAlignment="flex-start"
      crossAxisAlignment="center"
      width="100%"
      my={4}
      px={4}
      overflowX="auto"
      flexShrink={0}
      {...others}
    >
      {children}
    </Row>
  );
};

const AddRewardsDistributorButton = ({
  openAddRewardsDistributorModal,
  comptrollerAddress,
}: {
  openAddRewardsDistributorModal: () => any;
  comptrollerAddress: string;
}) => {
  const { t } = useTranslation();

  const isUpgradeable = useIsUpgradeable(comptrollerAddress);

  return isUpgradeable ? (
    <DashboardBox
      onClick={openAddRewardsDistributorModal}
      as="button"
      py={1}
      px={2}
      fontWeight="bold"
    >
      {t("Add Rewards Distributor")}
    </DashboardBox>
  ) : null;
};

const RewardsDistributorRow = ({
  rewardsDistributor,
  handleRowClick,
  hideModalDivider,
  activeCTokens,
}: {
  rewardsDistributor: RewardsDistributor;
  handleRowClick: (rD: RewardsDistributor) => void;
  hideModalDivider: boolean;
  activeCTokens: string[];
}) => {
  const { address, fuse } = useRari();
  const isAdmin = address === rewardsDistributor.admin;

  const tokenData = useTokenData(rewardsDistributor.rewardToken);
  //   Balances
  const { data: rDBalance } = useTokenBalance(
    rewardsDistributor.rewardToken,
    rewardsDistributor.address
  );

  const underlyingsMap = useCTokensUnderlying(activeCTokens);
  const underlyings = Object.values(underlyingsMap);

  return (
    <>
      <Tr
        _hover={{ background: "grey", cursor: "pointer" }}
        h="30px"
        p={5}
        flexDir="row"
        onClick={() => handleRowClick(rewardsDistributor)}
      >
        <Td>
          <HStack>
            {tokenData?.logoURL ? (
              <Image
                src={tokenData.logoURL}
                boxSize="30px"
                borderRadius="50%"
              />
            ) : null}
            <Heading fontSize="22px" color={tokenData?.color ?? "#FFF"} ml={2}>
              {tokenData ? tokenData.symbol ?? "Invalid Address!" : "Loading..."}
            </Heading>
          </HStack>
        </Td>

        <Td>
          {!!underlyings.length ? (
            <CTokenAvatarGroup tokenAddresses={underlyings} popOnHover={true} />
          ) : (
            <Badge colorScheme="red">Inactive</Badge>
          )}
        </Td>

        <Td>
          {(parseFloat(rDBalance?.toString() ?? "0") / 1e18).toFixed(3)}{" "}
          {tokenData?.symbol}
        </Td>

        <Td>
          <Badge colorScheme={isAdmin ? "green" : "red"}>
            {isAdmin ? "Is Admin" : "Not Admin"}
          </Badge>
        </Td>
      </Tr>
      {/* {!hideModalDivider && <ModalDivider />} */}
    </>
  );
};
