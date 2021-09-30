
// Chakra and UI
import { Text } from "@chakra-ui/layout";
import { Column } from "utils/chakraUtils";
import { Fade } from "@chakra-ui/transition";

// Rari
import { useRari } from "../../../../../../context/RariContext";

// Utils
import { TokenData } from "../../../../../../hooks/useTokenData";

// Components
import BaseTokenOracleConfig from "../OracleConfig/BaseTokenOracleConfig";
import IRMChart from "../IRMChart";

const Screen2 = ({
    shouldShowUniV3BaseTokenOracleForm,
    setBaseTokenActiveOracleName,
    baseTokenActiveOracleName, 
    setUniV3BaseTokenOracle,
    uniV3BaseTokenOracle,
    // OracleConfigArgs,
    interestRateModel,
    baseTokenAddress,
    uniV3BaseToken,
    oracleData,
    tokenData,
    curves,
    stage,
    mode,
  }: {
    mode: "Editing" | "Adding";
    stage: number;
    curves: any;
    tokenData: TokenData;
    oracleData: any;
    uniV3BaseToken: string;
    baseTokenAddress: string;
    interestRateModel: string;
    // OracleConfigArgs: any;
    uniV3BaseTokenOracle: string;
    setUniV3BaseTokenOracle: any;
    baseTokenActiveOracleName: any, 
    setBaseTokenActiveOracleName: any
    shouldShowUniV3BaseTokenOracleForm: boolean;
    
  }) => {

    const { fuse } = useRari()
    return (
      <Column
        mainAxisAlignment="center"
        crossAxisAlignment="center"
        overflowY="scroll"
        maxHeight="100%"
        height="95%"
        width="100%"
        maxWidth="100%"
      >
        <Fade in={stage === 1} unmountOnExit>
          {mode === "Adding" && (
            <Column
              w="100%"
              height="100%"
              mainAxisAlignment="flex-start"
              crossAxisAlignment="center"
            >
              <IRMChart curves={curves} tokenData={tokenData} />
              <Text>
                {fuse.identifyInterestRateModelName(interestRateModel).replace("_", " ")}
              </Text>
            </Column>
          )}
        </Fade>
        <Fade in={stage === 2} unmountOnExit>
          <Column
            width="100%"
            height="100%"
            mainAxisAlignment="center"
            crossAxisAlignment="center"
          >
            {shouldShowUniV3BaseTokenOracleForm && mode === "Adding" && (
              <BaseTokenOracleConfig
                mode={mode}
                oracleData={oracleData}
                uniV3BaseToken={uniV3BaseToken}
                baseTokenAddress={uniV3BaseToken}
                uniV3BaseTokenOracle={uniV3BaseTokenOracle}
                setUniV3BaseTokenOracle={setUniV3BaseTokenOracle}
                baseTokenActiveOracleName={baseTokenActiveOracleName} 
                setBaseTokenActiveOracleName={setBaseTokenActiveOracleName}
              />
            )}
          </Column>
        </Fade>
      </Column>
    );
  };
export default Screen2