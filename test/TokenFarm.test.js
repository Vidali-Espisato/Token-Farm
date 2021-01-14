const { assert } = require("chai");

const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

require("chai")
  .use(require("chai-as-promised"))
  .should();

const tokens = (n) => {
  return web3.utils.toWei(n, "Ether");
};

contract("TokenFarm", ([owner, investor]) => {
  let daiToken, dappToken, tokenFarm;

  before(async () => {
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    await dappToken.transfer(tokenFarm.address, tokens("1000000"));
    await daiToken.transfer(investor, tokens("100"), { from: owner });
  });

  describe("Mock DAI deployment", async () => {
    it("has a name", async () => {
      const name = await daiToken.name();
      assert.equal(name, "Mock DAI Token");
    });
  });

  describe("DApp Token deployment", async () => {
    it("has a name", async () => {
      const name = await dappToken.name();
      assert.equal(name, "DApp Token");
    });
  });

  describe("Token Farm deployment", async () => {
    it("has a name", async () => {
      const name = await tokenFarm.name();
      assert.equal(name, "Dapp Token Farm");
    });

    it("has initial tokens", async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens("1000000"));
    });
  });

  describe("Token Farm operations", async () => {
    it("stakes mDai tokens approved by investors", async () => {
      let balance = await daiToken.balanceOf(investor);
      assert.equal(
        balance.toString(),
        tokens("100"),
        "investor wallet mDai balance incorrect before staking"
      );

      await daiToken.approve(tokenFarm.address, tokens("50"), {
        from: investor,
      });
      await tokenFarm.stakeTokens(tokens("50"), { from: investor });

      balance = await daiToken.balanceOf(investor);
      assert.equal(
        balance.toString(),
        tokens("50"),
        "investor wallet mDai balance incorrect after staking"
      );

      let tfBalance = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        tfBalance.toString(),
        tokens("50"),
        "token farm wallet mDai balance incorrect after staking"
      );

      await daiToken.approve(tokenFarm.address, tokens("30"), {
        from: investor,
      });
      await tokenFarm.stakeTokens(tokens("30"), { from: investor });

      let new_balance = await daiToken.balanceOf(investor);
      assert.equal(
        new_balance.toString(),
        tokens("20"),
        "investor wallet mDai balance incorrect after second stake"
      );

      let new_tfBalance = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        new_tfBalance.toString(),
        tokens("80"),
        "token farm wallet mDai balance incorrect after second stake"
      );

      let result = await tokenFarm.isStaking(investor);
      assert.equal(result, true);

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(result.toString(), tokens("80"));

      await tokenFarm.issueTokens({ from: owner });

      result = await dappToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("80"),
        "investor dApp wallet tokens incorrect"
      );

      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

      await tokenFarm.unstakeTokens({ from: investor });

      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens("100"),
        "investor mDai wallet tokens not correct"
      );

      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens("0"),
        "token farm mDai wallet tokens not correct"
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        tokens("0"),
        "staking balance of investor in token farm incorrect"
      );

      result = await tokenFarm.isStaking(investor);
      assert.equal(
        result.toString(),
        "false",
        "isStaking flag not set properly"
      );
    });
  });
});
