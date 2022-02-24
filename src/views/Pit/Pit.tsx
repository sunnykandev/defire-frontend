import React, { useCallback, useMemo } from "react";
import Page from "../../components/Page";
import PitImage from "../../assets/img/pit.png";
import HomeImage from "../../assets/img/back.jpeg";
import { createGlobalStyle } from "styled-components";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { useWallet } from "use-wallet";
import UnlockWallet from "../../components/UnlockWallet";
import PageHeader from "../../components/PageHeader";
import ExchangeCard from "./components/ExchangeCard";
import styled from "styled-components";
import Spacer from "../../components/Spacer";
import useBondStats from "../../hooks/useBondStats";
import useTombFinance from "../../hooks/useTombFinance";
import useCashPriceInLastTWAP from "../../hooks/useCashPriceInLastTWAP";
import { useTransactionAdder } from "../../state/transactions/hooks";
import ExchangeStat from "./components/ExchangeStat";
import useTokenBalance from "../../hooks/useTokenBalance";
import useBondsPurchasable from "../../hooks/useBondsPurchasable";
import { getDisplayBalance } from "../../utils/formatBalance";
import { BOND_REDEEM_PRICE, BOND_REDEEM_PRICE_BN } from "../../tomb-finance/constants";
import { Typography } from "@material-ui/core";

const BackgroundImage = createGlobalStyle`
  body {
    background: url(${HomeImage}) no-repeat !important;
    background-size: cover !important;
}

* {
    background: transparent;
    border-radius: 0 !important;
    box-shadow: none !important;
}
`;

const Pit: React.FC = () => {
  const { path } = useRouteMatch();
  const { account } = useWallet();
  const tombFinance = useTombFinance();
  const addTransaction = useTransactionAdder();
  const bondStat = useBondStats();
  const cashPrice = useCashPriceInLastTWAP();
  const bondsPurchasable = useBondsPurchasable();

  const bondBalance = useTokenBalance(tombFinance?.TBOND);

  const handleBuyBonds = useCallback(
    async (amount: string) => {
      const tx = await tombFinance.buyBonds(amount);
      addTransaction(tx, {
        summary: `Buy ${Number(amount).toFixed(2)} TBOND with ${amount} TOMB`,
      });
    },
    [tombFinance, addTransaction]
  );

  const handleRedeemBonds = useCallback(
    async (amount: string) => {
      const tx = await tombFinance.redeemBonds(amount);
      addTransaction(tx, { summary: `Redeem ${amount} TBOND` });
    },
    [tombFinance, addTransaction]
  );
  const isBondRedeemable = useMemo(() => cashPrice.gt(BOND_REDEEM_PRICE_BN), [cashPrice]);
  const isBondPurchasable = useMemo(() => Number(bondStat?.tokenInFtm) < 1.01, [bondStat]);

  return (
    <Switch>
      <Page>
        <BackgroundImage />
        {!!account ? (
          <>
            <Typography color='textPrimary' align='center' variant='h3' gutterBottom>
              3Bonds
            </Typography>
            <Route exact path={path}>
              <PageHeader icon={"🏦"} subtitle='Earn premiums upon redemption' />
            </Route>
            <StyledBond>
              <StyledCardWrapper>
                <ExchangeCard
                  action='Purchase'
                  fromToken={tombFinance.TOMB}
                  fromTokenName='3OMB'
                  toToken={tombFinance.TBOND}
                  toTokenName='3BOND'
                  priceDesc={!isBondPurchasable ? "3OMB is over peg" : getDisplayBalance(bondsPurchasable, 18, 4) + " 3BOND available for purchase"}
                  onExchange={handleBuyBonds}
                  disabled={!bondStat || isBondRedeemable}
                />
              </StyledCardWrapper>
              <StyledStatsWrapper>
                <ExchangeStat tokenName='3OMB' description='Last-Hour TWAP Price' price={getDisplayBalance(cashPrice, 18, 4)} />
                <Spacer size='md' />
                <ExchangeStat tokenName='3BOND' description='Current Price: (3OMB)^2' price={Number(bondStat?.tokenInFtm).toFixed(2) || "-"} />
              </StyledStatsWrapper>
              <StyledCardWrapper>
                <ExchangeCard
                  action='Redeem'
                  fromToken={tombFinance.TBOND}
                  fromTokenName='3BOND'
                  toToken={tombFinance.TOMB}
                  toTokenName='3OMB'
                  priceDesc={`${getDisplayBalance(bondBalance)} 3BOND Available in wallet`}
                  onExchange={handleRedeemBonds}
                  disabled={!bondStat || bondBalance.eq(0) || !isBondRedeemable}
                  disabledDescription={!isBondRedeemable ? `Enabled when 3OMB > ${BOND_REDEEM_PRICE}FTM` : null}
                />
              </StyledCardWrapper>
            </StyledBond>
          </>
        ) : (
          <UnlockWallet />
        )}
      </Page>
    </Switch>
  );
};

const StyledBond = styled.div`
  display: flex;
  background: transparent;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`;

const StyledCardWrapper = styled.div`
  display: flex;
  flex: 1;
  background: transparent;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 80%;
  }
`;

const StyledStatsWrapper = styled.div`
  display: flex;
  flex: 0.8;
  margin: 0 20px;
  background: transparent;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 80%;
    margin: 16px 0;
  }
`;

export default Pit;
