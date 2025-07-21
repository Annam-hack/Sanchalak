from setuptools import setup, find_packages

setup(
    name="sanchalak",
    version="0.1.0",
    description="Unified government scheme eligibility system (EFR, scheme server, schemabot, pipeline, translation)",
    author="AnnamAI Team",
    package_dir={"": "."},
    packages=find_packages(include=[
        "schemabot*",
        "scheme_server*",
        "efr_server*",
        "pipeline*",
        "translation*"
    ], where="."),
    install_requires=[],  # You can add core dependencies here if needed
    include_package_data=True,
    python_requires=">=3.8",
) 