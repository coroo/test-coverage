const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const rd = require("readline");


function readJSON(filename: string): any {
  const rawdata = fs.readFileSync(filename);
  return rawdata;
  // const benchmarkJSON = JSON.parse(rawdata);

  // let benchmarks : { [name: string] : Benchmark} = {};
  // for(const benchmark of benchmarkJSON["benchmarks"]) {
  //   benchmarks[benchmark["fullname"]] = new Benchmark(benchmark);
  // }

  // return benchmarks;
}

function createMessage(pytestResult: any) {
  // let message = "### Result of Coverage Tests\n";
  // message += pytestResult;
  // let newMessage = message.replace(/Name                                                    Stmts   Miss  Cover/g, '|Name|Stmts|Miss|Cover|').replace(/---------------------------------------------------------------------------/g, '|:--:|----:|---:|----:|');
  // return message;

  // Table Title
  // message += "| Benchmark | Min | Max | Mean |";
  // if(oldBenchmarks !== undefined) {
  //   message += " Mean on Repo `HEAD` |"
  // }
  // message += "\n";

  // // Table Column Definition
  // message += "| :--- | :---: | :---: | :---: |";
  // if(oldBenchmarks !== undefined) {
  //   message += " :---: |"
  // }
  // message += "\n";

  // // Table Rows
  // for (const benchmarkName in pytestResult) {
  //   const benchmark = pytestResult[benchmarkName];

  //   message += `| ${benchmarkName}`;
  //   message += `| ${benchmark.min}`;
  //   message += `| ${benchmark.max}`;
  //   message += `| ${benchmark.mean} `;
  //   message += `+- ${benchmark.stddev} `;

  //   if(oldpytestResult !== undefined) {
  //     const oldBenchmark = oldpytestResult[benchmarkName]
  //     message += `| ${oldBenchmark.mean} `;
  //     message += `+- ${oldBenchmark.stddev} `;
  //   }
  //   message += "|\n"
  // }
  const newString = new String(pytestResult);

  const lineOfText = newString.split('\n');
  let startKey = "0";
  let newMessage = "### Result of Coverage Tests\n";
  let lastMessage = "";
  for(let i in lineOfText){
      if( lineOfText[i].indexOf('coverage: platform darwin,') >= 0){
          startKey = i;
          newMessage += "\n"+lineOfText[i]+"\n"; delete lineOfText[i];
          console.log(newMessage);
      }
      if(startKey != "0" && lineOfText[i]!=undefined){
          if( lineOfText[i].indexOf('Name                                  Stmts   Miss  Cover') >= 0){
              newMessage += "| Name | Stmts | Miss | Cover |\n| :--- | ----: | ---: | ----: |\n";
              delete lineOfText[i];
          }else if( lineOfText[i].indexOf('---------------------------------------------------------') >= 0){
              delete lineOfText[i];
          }else if( lineOfText[i].indexOf('passed in') >= 0){
              lastMessage += "\n"+lineOfText[i];
              delete lineOfText[i];
          }
          if(lineOfText[i]!=undefined){
              let tabOfText = lineOfText[i].split(/\s+/);
              for(let t in tabOfText){
                  if(tabOfText[t]!=""){
                      tabOfText[t] = "| "+tabOfText[t];
                  } else {
                      delete tabOfText[t];
                  }
              }
              if(tabOfText[3]!=undefined){
                  newMessage += tabOfText[0]+tabOfText[1]+tabOfText[2]+tabOfText[3]+"|\n";
                  console.log(newMessage);
              }
          }
      }
  }
  return newMessage;
  // return newMessage+lastMessage;
}

async function run(): Promise<void> {
  if (github.context.eventName !== "pull_request") {
    core.setFailed("Can only run on pull requests!");
    return;
  }

  const githubToken = core.getInput("token");
  const pytestFileName = core.getInput("pytest-coverage");

  const pytests = readJSON(pytestFileName);

  const message = createMessage(pytests);
  console.log(message);

  const context = github.context;
  const pullRequestNumber = context.payload.pull_request.number;

  const octokit = github.getOctokit(githubToken);

  // Now decide if we should issue a new comment or edit an old one
  const { data: comments } = await octokit.issues.listComments({
    ...context.repo,
    issue_number: pullRequestNumber,
  });

  const comment = comments.find((comment: any) => {
    return (
      comment.user.login === "github-actions[bot]" &&
      comment.body.startsWith("### Result of Coverage Tests\n")
    );
  });

  if (comment) {
    await octokit.issues.updateComment({
      ...context.repo,
      comment_id: comment.id,
      body: message
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: pullRequestNumber,
      body: message
    });
  }

  // try {
  //   const ms: string = core.getInput('milliseconds')
  //   core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

  //   core.debug(new Date().toTimeString())
  //   await wait(parseInt(ms, 10))
  //   core.debug(new Date().toTimeString())

  //   core.setOutput('time', new Date().toTimeString())
  // } catch (error) {
  //   core.setFailed(error.message)
  // }
}

// run()
run().catch(error => core.setFailed("Workflow failed! " + error.message));
