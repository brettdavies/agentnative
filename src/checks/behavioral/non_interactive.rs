use std::time::Duration;

use crate::check::Check;
use crate::project::Project;
use crate::runner::{BinaryRunner, RunStatus};
use crate::types::{CheckGroup, CheckLayer, CheckResult, CheckStatus};

pub struct NonInteractiveCheck;

impl Check for NonInteractiveCheck {
    fn id(&self) -> &str {
        "p1-non-interactive"
    }

    fn applicable(&self, project: &Project) -> bool {
        project.runner.is_some() && !project.binary_paths.is_empty()
    }

    fn run(&self, project: &Project) -> anyhow::Result<CheckResult> {
        // Use a dedicated short-timeout runner (1s) rather than the shared one.
        // Running a binary with zero args risks infinite recursion if the target
        // binary is agentnative itself (dogfood) or any CLI whose default action
        // spawns long-running work. A 1s timeout is enough to detect stdin-blocking.
        let binary = project.binary_paths[0].clone();
        let runner = match BinaryRunner::new(binary, Duration::from_secs(1)) {
            Ok(r) => r,
            Err(e) => {
                return Ok(CheckResult {
                    id: self.id().to_string(),
                    label: "Non-interactive by default".into(),
                    group: CheckGroup::P1,
                    layer: CheckLayer::Behavioral,
                    status: CheckStatus::Error(format!("cannot create runner: {e}")),
                });
            }
        };

        // Run with no args and stdin null. A well-behaved CLI should either
        // show help/usage and exit, or error out — not block waiting for input.
        let result = runner.run(&[], &[]);

        let status = match result.status {
            RunStatus::Timeout => {
                CheckStatus::Warn("binary may be waiting for interactive input".into())
            }
            RunStatus::Ok => CheckStatus::Pass,
            RunStatus::Crash { signal } => {
                CheckStatus::Warn(format!("binary crashed on empty args (signal {signal})"))
            }
            _ => CheckStatus::Error(format!("unexpected status: {:?}", result.status)),
        };

        Ok(CheckResult {
            id: self.id().to_string(),
            label: "Non-interactive by default".into(),
            group: CheckGroup::P1,
            layer: CheckLayer::Behavioral,
            status,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::checks::behavioral::tests::test_project_with_runner;
    use crate::types::CheckStatus;

    #[test]
    fn non_interactive_pass_with_echo() {
        // echo with no args exits immediately
        let project = test_project_with_runner("/bin/echo");
        let result = NonInteractiveCheck.run(&project).unwrap();
        assert!(matches!(result.status, CheckStatus::Pass));
    }

    #[test]
    fn non_interactive_pass_with_false() {
        // /bin/false exits immediately with non-zero
        let project = test_project_with_runner("/bin/false");
        let result = NonInteractiveCheck.run(&project).unwrap();
        assert!(matches!(result.status, CheckStatus::Pass));
    }
}
