const Election = artifacts.require('./Election.sol')

contract('Election', function (accounts) {
  let electionInstance

  it('initializes with two candidates', async () => {
    const instance = await Election.deployed()
    const candidatesCount = await instance.candidatesCount()

    assert.equal(candidatesCount, 2)
  })

  it('initializes the candidates with the correct values', async () => {
    const instance = await Election.deployed()
    const kiritoCandidate = await instance.candidates(1)

    assert.equal(kiritoCandidate[0], 1, 'contains the correct id')
    assert.equal(kiritoCandidate[1], 'Kirito', 'contains the correct name')
    assert.equal(kiritoCandidate[2], 0, 'contains the correct votes count')

    const eugeoCandidate = await instance.candidates(2)
    assert.equal(eugeoCandidate[0], 2, 'contains the correct id')
    assert.equal(eugeoCandidate[1], 'Eugeo', 'contains the correct name')
    assert.equal(eugeoCandidate[2], 0, 'contains the correct votes count')
  })

  it('allows a voter to cast a vote', async () => {
    const electionInstance = await Election.deployed()
    const candidateId = 1

    const receipt = await electionInstance.vote(candidateId, {
      from: accounts[0]
    })
    assert.equal(receipt.logs.length, 1, 'an event was triggered')
    assert.equal(receipt.logs[0].event, 'votedEvent', 'the event type is correct')
    assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, 'the candidate id is correct')

    const hasVoted = await electionInstance.voters(accounts[0])
    assert(hasVoted, 'the voter was marked as voted')

    const candidate = await electionInstance.candidates(candidateId)
    assert.equal(candidate.voteCount, 1, 'increments the candidate\'s vote count')
  })

  it('throws an exception for double voting', async () => {
    const electionInstance = await Election.deployed()
    const candidateId = 2

    electionInstance.vote(candidateId, { from: accounts[1] })

    const candidate = await electionInstance.candidates(candidateId)
    assert.equal(candidate.voteCount, 1, 'accepts first vote')

    try {
      await electionInstance.vote(candidateId, { from: accounts[1] })
      assert.fail
    } catch (e) {
      assert(e.message.indexOf('revert') >= 0, 'error message must contain revert')
    }

    const candidate1 = await electionInstance.candidates(1)
    assert.equal(candidate1.voteCount, 1, 'candidate 1 did not receive any votes')

    const candidate2 = await electionInstance.candidates(2)
    assert.equal(candidate2.voteCount, 1, 'candidate 2 did not receive any votes')
  })
})