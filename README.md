mentor-graphql
==================

Usage
-----

A docker image that serves mentor-admins's node-based GraphQL api


Running Tests
-------------

```
make test
```

Development
-----------

Required Software
=================
- node 18.13+
- npm
- make


Any changes made to this repo should be covered by tests. To run the existing tests:

```
make test
```

All pushed commits must also pass format and lint checks. To check all required tests before a commit:

```
make test-all
```

To fix formatting issues:

```
make format
```

Technical Debt
-------------
  - mongo-unit is outdated, fork/switch libraries.
  - mongo-cursor-pagination is outdated, fork/switch libraries.
  - license-check-and-add is outdated, fork/switch libraries.
