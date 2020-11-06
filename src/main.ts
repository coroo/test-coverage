const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
const { exec } = require('child_process');


function execCommand(testFolder: string): void {
  exec('if [ -f .ignorecoveragerc ]; then pytest --cache-clear --cov=app --cov-config=.ignorecoveragerc test/ > output.txt; else pytest --cov=app test/; fi', (err: any, stdout: any, stderr: any) => {
    if(err != null){
        console.log(err);
    }
  });
}

function createMessage(filename: any) {
  const file = fs.readFileSync(filename);
  const newString = new String(file);

  const lineOfText = newString.split('\n');
  let startKey = "0";
  let newMessage = "### :white_check_mark: Result of Coverage Tests\n";
  let lastMessage = "";
  let delLine = "";
  for(let i in lineOfText){
      if( lineOfText[i].indexOf('coverage: platform') >= 0){
          startKey = i;
          newMessage += "\n"+lineOfText[i]+"\n"; delete lineOfText[i]; 
          let iNext = (parseInt(i))+1; delLine = iNext.toString();
          newMessage += "| Name | Stmts | Miss | Cover |\n| :--- | ----: | ---: | ----: |\n";
      } else {
        newMessage += "TIDAK MASUK LAGI";
        newMessage += lineOfText[i];
      }
      if( i == delLine ){
          delete lineOfText[i];
      }
      if(startKey != "0" && lineOfText[i]!=undefined){
          if( lineOfText[i].indexOf('---------------------------------------------------------') >= 0){
              delete lineOfText[i];
          }else if( lineOfText[i].indexOf('passed in') >= 0){
              lastMessage += "\n~"+lineOfText[i].replace(/=/g, "")+"~";
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
  return newMessage+lastMessage;
}

async function run(): Promise<void> {
  if (github.context.eventName !== "pull_request") {
    core.setFailed("Can only run on pull requests!");
    return;
  }

  const githubToken = core.getInput("token");
  const pytestFileName = core.getInput("pytest-coverage");

  await execCommand("test/");

  const message = createMessage(pytestFileName);
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
      comment.body.startsWith("### :white_check_mark: Result of Coverage Tests\n")
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
