/**
 *Submitted for verification at sepolia.basescan.org on 2026-01-04
*/

/**
 *Submitted for verification at sepolia.basescan.org on 2026-01-04
*/

/**
 *Submitted for verification at sepolia.basescan.org on 2026-01-02
*/

/**
 *Submitted for verification at sepolia.basescan.org on 2026-01-02
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simple ERC20 interface
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

/**
 * Tender Management Contract
 * - UI controls bidding time
 * - Blockchain only stores state & handles payment
 */
contract TenderManagement {
    // ----------------------------
    // State Variables
    // ----------------------------
    address public government;
    IERC20 public tenderCoin;

    uint256 public tenderCount;

    struct Tender {
        uint256 tenderId;
        string title;
        string description;
        uint256 maxAmount;       // starting price
        uint256 minAmount;       // minimum allowed bid
        uint256 currentBid;      // lowest bid
        address lowestBidder;    // winner
        uint256 biddingStart;    // informational only
        uint256 biddingEnd;      // informational only
        bool workCompleted;
        bool paymentReleased;
        bool cancelled;
    }

    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => address[]) public bidders;

    // ----------------------------
    // Modifiers
    // ----------------------------
    modifier onlyGovernment() {
        require(msg.sender == government, "Only government allowed");
        _;
    }

    modifier tenderExists(uint256 _tenderId) {
        require(_tenderId > 0 && _tenderId <= tenderCount, "Tender not found");
        _;
    }

    // ----------------------------
    // Constructor
    // ----------------------------
    constructor(address _tenderCoin) {
        government = msg.sender;
        tenderCoin = IERC20(_tenderCoin);
    }

    // ----------------------------
    // Create Tender (Government)
    // ----------------------------
    function createTender(
        string memory _title,
        string memory _description,
        uint256 _maxAmount,
        uint256 _minAmount,
        uint256 _biddingStart,
        uint256 _biddingEnd
    ) external onlyGovernment {
        require(_maxAmount > _minAmount, "Max must be greater than min");

        tenderCount++;

        tenders[tenderCount] = Tender({
            tenderId: tenderCount,
            title: _title,
            description: _description,
            maxAmount: _maxAmount,
            minAmount: _minAmount,
            currentBid: _maxAmount,
            lowestBidder: address(0),
            biddingStart: _biddingStart, // UI reference only
            biddingEnd: _biddingEnd,     // UI reference only
            workCompleted: false,
            paymentReleased: false,
            cancelled: false
        });
    }

    // ----------------------------
    // Place Bid (Simple)
    // ----------------------------
    function placeBid(uint256 _tenderId, uint256 _bidAmount)
        external
        tenderExists(_tenderId)
    {
        Tender storage t = tenders[_tenderId];

        require(!t.cancelled, "Tender cancelled");
        require(_bidAmount < t.currentBid, "Bid must be lower");
        require(_bidAmount >= t.minAmount, "Below minimum");

        t.currentBid = _bidAmount;
        t.lowestBidder = msg.sender;

        bidders[_tenderId].push(msg.sender);
    }

    // ----------------------------
    // Mark Work Completed (Government)
    // ----------------------------
    function markWorkCompleted(uint256 _tenderId)
        external
        onlyGovernment
        tenderExists(_tenderId)
    {
        Tender storage t = tenders[_tenderId];

        require(!t.cancelled, "Tender cancelled");
        require(!t.workCompleted, "Already completed");
        require(t.lowestBidder != address(0), "No bidder selected");

        t.workCompleted = true;
    }

    // ----------------------------
    // Release Payment (Government)
    // ----------------------------
    function releasePayment(uint256 _tenderId)
        external
        onlyGovernment
        tenderExists(_tenderId)
    {
        Tender storage t = tenders[_tenderId];

        require(t.workCompleted, "Work not completed");
        require(!t.paymentReleased, "Payment already released");
        require(t.lowestBidder != address(0), "No winner");

        require(
            tenderCoin.transfer(t.lowestBidder, t.currentBid),
            "Token transfer failed"
        );

        t.paymentReleased = true;
    }

    // ----------------------------
    // Cancel Tender
    // ----------------------------
    function cancelTender(uint256 _tenderId)
        external
        onlyGovernment
        tenderExists(_tenderId)
    {
        Tender storage t = tenders[_tenderId];
        require(!t.paymentReleased, "Cannot cancel after payment");

        t.cancelled = true;
    }

    // ----------------------------
    // View Functions
    // ----------------------------
    function getTender(uint256 _tenderId)
        external
        view
        returns (Tender memory)
    {
        return tenders[_tenderId];
    }

    function getLowestBidder(uint256 _tenderId)
        external
        view
        returns (address, uint256)
    {
        Tender storage t = tenders[_tenderId];
        return (t.lowestBidder, t.currentBid);
    }

    function getBidders(uint256 _tenderId)
        external
        view
        returns (address[] memory)
    {
        return bidders[_tenderId];
    }
}