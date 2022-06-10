module "pipeline" {
  # source                  = "git@github.com:mentorpal/terraform-modules//modules/trunk_cicd_pipeline?ref=tags/v1.2.2"
  source                  = "git@github.com:mentorpal/terraform-modules//modules/trunk_cicd_pipeline?ref=cicd-test-stage"
  codestar_connection_arn = var.codestar_connection_arn
  project_name            = "mentor-graphql"
  github_repo_name        = "mentor-graphql"
  build_cache_type        = "NO_CACHE"
  deploy_cache_type       = "NO_CACHE"
  build_compute_type      = "BUILD_GENERAL1_SMALL"
  deploys_compute_type    = "BUILD_GENERAL1_SMALL"

  build_buildspec             = "cicd/buildspec.yml"
  deploy_staging_buildspec    = "cicd/deployspec_staging.yml"
  deploy_prod_buildspec       = "cicd/deployspec_prod.yml"
  
  e2e_tests_buildspec         = "cicd/e2espec.yml"
  deploys_privileged_mode     = false
  export_pipeline_info        = true
  enable_status_notifications = true

  tags = {
    Source    = "terraform"
    Project   = "mentorpal"
    Component = "graphql"
  }

  providers = {
    aws = aws.us_east_1
  }
}
